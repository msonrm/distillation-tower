# 蒸留シミュレータ 仕様書

## コンセプト

「ザルバールの蒸留塔」（1995年、オニオンソフト）のリメイク企画。オリジナルは比重差による液体分離パズルだったが、本作では**温度ベースの蒸留（分留）** をコアメカニクスに追加する。

本リポジトリはそのための**物理シミュレーション・プロトタイプ**であり、セル・オートマトンで沸点の異なる2種類の液体の加熱・気化・冷却・凝縮サイクルを再現する。

## ゲーム設計（最終目標）

```
┌─ 設定フェーズ ─────────────┐
│  壁・パイプの設置/削除      │
│  金属ブロックの配置         │
├─ 実行フェーズ ─────────────┤
│  液体流入開始              │
│  指タッチで金属を加熱/冷却   │
│  壁の変更は不可            │
├─ クリア判定 ───────────────┤
│  目標純度・量を達成したら   │
│  ステージクリア            │
└────────────────────────────┘
```

### 架空液体（ゲーム版で使用予定）

| 名前 | 色 | 比重 | 沸点 |
|------|-----|------|------|
| アクア | 青 | 中 | 中 |
| オレオ | 黄 | 軽 | 高 |
| ルビン | 赤 | 重 | 低 |
| ヴェルデ | 緑 | 中 | 極低 |

### クリア条件

指定タンクに、**目標純度以上**の液体を**一定量以上**回収する。

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5.9 |
| UI | React 19 |
| スタイリング | Tailwind CSS 4 + PostCSS |
| 描画 | Canvas API |
| デプロイ | Vercel |

## ディレクトリ構成

```
distillation-tower/
├── CLAUDE.md                          # Claude Code 指示書
├── SPEC.md                            # 本ドキュメント
├── TODO.md                            # タスク管理
├── CHANGELOG.md                       # 変更履歴
├── README.md
│
└── distillation-prototype/            # Next.js アプリケーション
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    │
    └── src/
        ├── app/
        │   ├── page.tsx               # メインページ（状態管理・アニメーションループ）
        │   ├── layout.tsx             # ルートレイアウト
        │   └── globals.css
        │
        ├── components/
        │   ├── SimulationCanvas.tsx    # Canvas 描画
        │   ├── ControlPanel.tsx       # パラメータ操作 UI
        │   ├── ParamSlider.tsx        # スライダーコンポーネント
        │   └── index.ts
        │
        └── lib/simulation/
            ├── engine.ts              # シミュレーションエンジン
            ├── types.ts               # 型定義 + デフォルトパラメータ
            ├── constants.ts           # 結合力・色・温度色変換
            └── index.ts
```

## 物理モデル

### ベース理論

イジングモデル + カワサキダイナミクス（セル交換） + 潜熱モデル（相転移）

### セルの種類

| 物質 | フェーズ | 役割 |
|------|----------|------|
| A | liquid / gas | 低沸点物質（アルコール的、沸点 0.48） |
| B | liquid / gas | 高沸点物質（水的、沸点 0.92） |
| wall | liquid | 壁（熱源・冷却源・側壁） |
| air | gas | 空気（空間） |

### セルデータ構造

```typescript
interface Cell {
  substance: "A" | "B" | "wall" | "air";
  phase: "liquid" | "gas";
  temperature: number;   // -1.0（冷却）〜 0.0（室温）〜 1.0+（加熱）
  latentHeat: number;    // 蓄積された潜熱
}
```

### 物質プロパティ

各物質（A, B）に対して以下が設定可能:

- **沸点** (boilingPoint)
- **潜熱閾値** (latentHeatThreshold)
- **液体密度** / **気体密度**
- **液体熱伝導率** / **気体熱伝導率**
- **液体比熱容量** / **気体比熱容量**

壁・空気は密度・熱伝導率・比熱容量のみ。

## シミュレーション処理フロー

毎フレーム、以下の4ステップを実行:

```
1. updateHeatAndCooling()    - 自然冷却（室温へのドリフト）
2. updateHeatConduction()    - フーリエの法則による熱伝導
3. updatePhaseTransition()   - 潜熱蓄積モデルによる相転移
4. updateKawasaki() × 2     - カワサキダイナミクスによるセル交換
```

### 1. 自然冷却

全セルの温度を室温方向へ減衰させる。壁は固定温度。

```
ΔT = -(T - roomTemp) × coolingCoefficient
```

### 2. 熱伝導（フーリエの法則）

4近傍で熱拡散。有効熱伝導率は調和平均を使用:

```
k_eff = 2 × k_self × k_neighbor / (k_self + k_neighbor + ε)
heatFlow = k_eff × (T_neighbor - T_self)
ΔT = Σ heatFlow / (heatCapacity + 0.1) × 0.1
```

温度は [-1, 1] にクランプ。上下壁は固定温度。

### 3. 相転移（潜熱モデル）

確率的ではなく、**潜熱蓄積モデル**を採用:

**気化** (liquid → gas):
- 温度 >= 沸点のとき、超過分を潜熱として蓄積
- 温度は沸点に固定
- 潜熱が閾値に達したらフェーズ変化

**凝縮** (gas → liquid):
- 温度 < 沸点のとき、不足分だけ潜熱を放出
- 温度は沸点に固定
- 潜熱が 0 になったらフェーズ変化

### 4. カワサキダイナミクス（セル交換）

チェッカーボード分解（パリティ交互）で並列性を確保。

**エネルギー計算**:

```
E = E_gravity + E_cohesion + E_interface

E_gravity   = density × (gridHeight - y) × gravity
E_cohesion  = -cohesion × 0.5 × (同種隣接セル数)
E_interface = Σ interaction[type][neighbor] × 0.8
```

**交換判定（メトロポリス法）**:

```
ΔE = E_after - E_before
β = 1 / (localTemp × 0.5 + 0.1)

if ΔE < 0: accept
else:       accept = random() < exp(-β × ΔE)
```

- 8方向（直交4 + 対角4）への交換を試行
- 対角交換は ΔE を √2 で割る（結合面積の補正）
- Fisher-Yates シャッフルで方向バイアスを排除
- スキャンパターンを8通りからランダム選択

### 相互作用マトリックス

6×6 の対称行列。正 = 反発、負 = 引力:

```
         AL    AG    BL    BG    W     Air
AL       0    -0.9   0.1   0.3  -0.05  0.9
AG      -0.9   0     0.3   0.1   0.1   0.1
BL       0.1   0.3   0    -0.9  -0.05  1.1
BG       0.3   0.1  -0.9   0     0.1   0.1
W       -0.1   0.1  -0.1   0.1   0     0.3
Air      0.9   0.1   1.1   0.1   0.3   0
```

## グリッド初期配置

```
Row 0:              冷却壁 (coolingTemp)
Row 1〜64:          空気
Row 65〜98:         A(40%) + B(60%) を 90% 密度でランダム配置
Row 99:             加熱壁 (heatSourceTemp)
Column 0, 99:       側壁 (roomTemp)
```

グリッドサイズ: 100 × 100（デフォルト）

## UI 構成

### Canvas 表示（左パネル）

- グリッドのリアルタイム描画
- 温度による色ブレンド（オプション）
- オーバーレイ: フレーム数、FPS、物質統計、平均温度

### コントロールパネル（右パネル、320px）

| カテゴリ | パラメータ |
|----------|------------|
| 制御 | 開始/停止、リセット、温度表示切替 |
| 物質A | 沸点、潜熱閾値、液/気の密度・熱伝導率・比熱容量 |
| 物質B | 同上 |
| 壁 | 密度、熱伝導率、比熱容量 |
| 空気 | 密度、熱伝導率、比熱容量 |
| システム | 重力、冷却係数、熱源温度、冷却温度 |
| 相互作用 | 6×6 対称マトリックス |

### 描画色

| セル | 色 | 説明 |
|------|-----|------|
| A:liquid | `#f97316` | オレンジ |
| A:gas | `#fed7aa` | 薄オレンジ |
| B:liquid | `#3b82f6` | 青 |
| B:gas | `#93c5fd` | 薄青 |
| wall | `#374151` | 灰 |
| air | `#0d1117` | 暗い背景 |

## デフォルトパラメータ

### システム

| パラメータ | デフォルト値 |
|------------|-------------|
| gridWidth / gridHeight | 100 |
| roomTemp | 0.0 |
| heatSourceTemp | 13.0 |
| coolingTemp | -1.0 |
| coolingCoefficient | 0.006 |
| gravity | 1.9 |

### 物質A（低沸点・アルコール的）

| パラメータ | 値 |
|------------|-----|
| boilingPoint | 0.48 |
| latentHeatThreshold | 0.57 |
| liquidDensity | 0.7 |
| gasDensity | 0.01 |

### 物質B（高沸点・水的）

| パラメータ | 値 |
|------------|-----|
| boilingPoint | 0.92 |
| latentHeatThreshold | 0.92 |
| liquidDensity | 0.9 |
| gasDensity | 0.01 |

## ローカル実行

```bash
cd distillation-prototype
npm install
npm run dev
```

http://localhost:3000 で確認。
