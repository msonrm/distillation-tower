# ザルバールの蒸留塔 — 製品仕様書

## コンセプト

「ザルバールの蒸留塔」（1995年、オニオンソフト）のリメイク。
オリジナルは比重差による液体分離パズルだったが、本作では**温度ベースの蒸留（分留）** をコアメカニクスに追加する。

## プラットフォーム・技術方針

| 項目 | 方針 |
|------|------|
| プラットフォーム | iPad (iOS) |
| 言語 | Swift |
| UI フレームワーク | SwiftUI |
| 描画 | SwiftUI `Canvas` ビュー |
| アニメーション | `TimelineView` |
| 状態管理 | `@Observable` |
| 配布リポジトリ | `distillation-tower.swiftpm` |
| 開発環境 | iPad Swift Playgrounds / Xcode |

### リポジトリ構成

```
distillation-tower/                    # 本リポジトリ（設計・プロトタイプ）
├── SPEC.md                            # 本ドキュメント（製品仕様）
├── PROTOTYPE.md                       # Web版プロトタイプ実装仕様
├── TODO.md
├── CHANGELOG.md
└── distillation-prototype/            # Web版 (Next.js) — パラメータ調整用

distillation-tower.swiftpm/            # 別リポジトリ（製品）
├── Package.swift
├── Sources/
│   ├── App.swift
│   ├── Models/
│   │   ├── Cell.swift                 # セルデータ構造
│   │   ├── Substance.swift            # 物質 enum + プロパティ
│   │   └── SimulationParams.swift     # パラメータ定義
│   ├── Engine/
│   │   ├── SimulationEngine.swift     # メイン処理ループ
│   │   ├── HeatConduction.swift       # 熱伝導
│   │   ├── PhaseTransition.swift      # 相転移
│   │   └── KawasakiDynamics.swift     # セル交換
│   └── Views/
│       ├── GameView.swift             # メイン画面
│       ├── SimulationCanvas.swift     # Canvas 描画
│       ├── SetupPhaseView.swift       # 設定フェーズ UI
│       └── StageSelectView.swift      # ステージ選択
└── Resources/
    └── Stages/                        # ステージデータ (JSON)
```

> `.swiftpm` パッケージ形式にすることで、iPadでリポジトリをダウンロードし Swift Playgrounds から直接開ける。

## ゲーム設計

### ゲームフロー

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

### 操作システム

| 要素 | 操作 |
|------|------|
| 壁 | 設定フェーズで設置/削除 |
| 金属ブロック | 設定フェーズで配置、実行中に指タッチで作動 |

### 金属の種類

| 金属 | 効果 |
|------|------|
| 赤銅 | 触れると高温（加熱用） |
| 青鋼 | 触れると低温（冷却用） |

### 架空液体

| 名前 | 色 | 比重 | 沸点 |
|------|-----|------|------|
| アクア | 青 | 中 | 中 |
| オレオ | 黄 | 軽 | 高 |
| ルビン | 赤 | 重 | 低 |
| ヴェルデ | 緑 | 中 | 極低 |

数値は非表示。「重い/軽い」「蒸発しやすい/しにくい」で抽象的に表現する。

### クリア条件

指定タンクに、**目標純度以上**の液体を**一定量以上**回収する。

例: ルビンを純度80%以上で50ml回収せよ

## 物理モデル

> Web版プロトタイプで検証済み。詳細な実装パラメータは [PROTOTYPE.md](PROTOTYPE.md) を参照。

### ベース理論

イジングモデル + カワサキダイナミクス（セル交換） + 潜熱モデル（相転移）

### セルデータ構造

```swift
struct Cell {
    var substance: Substance   // .aqua, .oleo, .rubin, .verde, .wall, .air
    var phase: Phase           // .liquid, .gas
    var temperature: Double    // -1.0（冷却）〜 0.0（室温）〜 1.0+（加熱）
    var latentHeat: Double     // 蓄積された潜熱
}
```

> `Cell` を `struct` にすることで連続メモリ配置となり、キャッシュ効率が向上する。

### 処理フロー（毎フレーム）

```
1. updateHeatAndCooling()    - 自然冷却（室温へのドリフト）
2. updateHeatConduction()    - フーリエの法則による熱伝導
3. updatePhaseTransition()   - 潜熱蓄積モデルによる相転移
4. updateKawasaki() × N     - カワサキダイナミクスによるセル交換
```

### エネルギー計算

```
E = E_gravity + E_cohesion + E_interface

E_gravity   = density × (gridHeight - y) × gravity
E_cohesion  = -cohesion × 0.5 × (同種隣接セル数)
E_interface = Σ interaction[type][neighbor] × 0.8
```

### 交換判定（メトロポリス法）

```
ΔE = E_after - E_before
β = 1 / (localTemp × 0.5 + 0.1)

if ΔE < 0: accept
else:       accept = random() < exp(-β × ΔE)
```

- 8方向（直交4 + 対角4）への交換を試行
- 対角交換は ΔE を √2 で割る（結合面積の補正）
- Fisher-Yates シャッフルで方向バイアスを排除
- チェッカーボード分解（パリティ交互）で並列性を確保

### 相転移（潜熱モデル）

**気化** (liquid → gas):
- 温度 >= 沸点のとき、超過分を潜熱として蓄積
- 温度は沸点に固定
- 潜熱が閾値に達したらフェーズ変化

**凝縮** (gas → liquid):
- 温度 < 沸点のとき、不足分だけ潜熱を放出
- 温度は沸点に固定
- 潜熱が 0 になったらフェーズ変化

### 熱伝導（フーリエの法則）

```
k_eff = 2 × k_self × k_neighbor / (k_self + k_neighbor + ε)
heatFlow = k_eff × (T_neighbor - T_self)
ΔT = Σ heatFlow / (heatCapacity + 0.1) × 0.1
```

## SwiftUI 移植メモ

### Web版との対応

| Web版 (TypeScript) | SwiftUI版 |
|---|---|
| `requestAnimationFrame` | `TimelineView(.animation)` |
| React `useState` / `useRef` | `@Observable` クラス |
| Canvas API (`fillRect`) | SwiftUI `Canvas` + `context.fill(Path)` |
| スライダー UI | SwiftUI `Slider` / `.inspector` |
| `SimParams` (object) | `SimulationParams` (struct, Codable) |
| `Cell[][]` (Array of objects) | `[Cell]` (1D struct 配列, row-major) |

### パフォーマンス上の注意

- `Cell` は必ず `struct` にする（`class` にしない）
- グリッドは `[Cell]`（1次元配列, row-major）でアクセスする
- `Canvas` ビューでは `context.fill(Path)` をバッチ描画する
- 将来的に Metal Compute Shader への移行も視野に入れる（Xcode必須）
