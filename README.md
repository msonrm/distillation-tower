# distillation-tower

「ザルバールの蒸留塔」リメイク — 温度ベースの蒸留パズルゲーム。

セル・オートマトン（カワサキダイナミクス）で沸点の異なる液体の加熱・気化・冷却・凝縮による分留サイクルを再現する。

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [SPEC.md](SPEC.md) | 製品仕様（SwiftUI版ゲーム設計・物理モデル） |
| [PROTOTYPE.md](PROTOTYPE.md) | Web版プロトタイプ実装仕様（パラメータ調整用） |
| [TODO.md](TODO.md) | タスク管理 |
| [CHANGELOG.md](CHANGELOG.md) | 変更履歴 |

## リポジトリ構成

| リポジトリ | 用途 |
|------------|------|
| `distillation-tower` (本リポジトリ) | 設計 + Web版プロトタイプ |
| `distillation-tower.swiftpm` (将来) | SwiftUI製品版（iPad Swift Playgrounds対応） |

## Web版プロトタイプの実行

```bash
cd distillation-prototype
npm install
npm run dev
```

http://localhost:3000 で確認。
