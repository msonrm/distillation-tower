# TODO

## In Progress

- [ ] Web版プロトタイプでのパラメータチューニング: 蒸留サイクル（加熱→気化→上昇→冷却→凝縮→滴下）の安定動作

## Planned — SwiftUI版

- [ ] `distillation-tower.swiftpm` リポジトリの作成・初期セットアップ
- [ ] シミュレーションエンジンの Swift 移植（Cell struct, 1D配列化）
- [ ] SwiftUI Canvas による描画実装
- [ ] 設定フェーズ UI（壁・パイプ・金属ブロックの設置）
- [ ] 実行フェーズ UI（タッチで加熱/冷却操作）
- [ ] 液体の種類を4種に拡張（アクア、オレオ、ルビン、ヴェルデ）
- [ ] クリア判定システム（純度・量の目標達成）
- [ ] ステージデータ設計 (JSON) + ステージ選択画面

## Deferred

- [ ] Metal Compute Shader によるシミュレーション高速化（Xcode必須）
- [ ] サウンド・エフェクト
