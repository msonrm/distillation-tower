"use client";

import { SimParams } from "@/lib/simulation";
import { ParamSlider } from "./ParamSlider";

interface ControlPanelProps {
  params: SimParams;
  running: boolean;
  showTemp: boolean;
  onParamChange: (key: keyof SimParams, value: number) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onToggleShowTemp: (show: boolean) => void;
}

export function ControlPanel({
  params,
  running,
  showTemp,
  onParamChange,
  onToggleRunning,
  onReset,
  onToggleShowTemp,
}: ControlPanelProps) {
  return (
    <div className="w-80 bg-[#161b22] border-l border-gray-800 p-4 overflow-y-auto">
      <h1 className="text-xl font-bold mb-4 text-cyan-400">蒸留プロトタイプ</h1>

      {/* Control Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={onToggleRunning}
          className={`flex-1 py-2 px-4 rounded font-medium transition ${
            running
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {running ? "停止" : "開始"}
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-2 px-4 rounded font-medium bg-gray-600 hover:bg-gray-700 transition"
        >
          リセット
        </button>
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={showTemp}
          onChange={(e) => onToggleShowTemp(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm">温度を色で表示</span>
      </label>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-1">
          温度設定
        </h2>

        <ParamSlider
          label="熱源温度"
          value={params.heatSourceTemp}
          min={100}
          max={300}
          onChange={(v) => onParamChange("heatSourceTemp", v)}
        />
        <ParamSlider
          label="冷却源温度"
          value={params.coldSourceTemp}
          min={0}
          max={50}
          onChange={(v) => onParamChange("coldSourceTemp", v)}
        />
        <ParamSlider
          label="室温"
          value={params.roomTemp}
          min={10}
          max={50}
          onChange={(v) => onParamChange("roomTemp", v)}
        />

        <h2 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-1 mt-6">
          相転移パラメータ
        </h2>

        <ParamSlider
          label="沸点"
          value={params.boilingPoint}
          min={50}
          max={150}
          onChange={(v) => onParamChange("boilingPoint", v)}
        />
        <ParamSlider
          label="気化確率"
          value={params.vaporizeRate}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={(v) => onParamChange("vaporizeRate", v)}
        />
        <ParamSlider
          label="凝縮確率"
          value={params.condenseRate}
          min={0.01}
          max={0.3}
          step={0.01}
          onChange={(v) => onParamChange("condenseRate", v)}
        />
        <ParamSlider
          label="気化潜熱"
          value={params.latentHeatVaporize}
          min={0}
          max={50}
          onChange={(v) => onParamChange("latentHeatVaporize", v)}
        />
        <ParamSlider
          label="凝縮潜熱"
          value={params.latentHeatCondense}
          min={0}
          max={50}
          onChange={(v) => onParamChange("latentHeatCondense", v)}
        />

        <h2 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-1 mt-6">
          物理パラメータ
        </h2>

        <ParamSlider
          label="重力"
          value={params.gravity}
          min={0.5}
          max={5}
          step={0.1}
          onChange={(v) => onParamChange("gravity", v)}
        />
        <ParamSlider
          label="熱伝導率"
          value={params.thermalConductivity}
          min={0.1}
          max={1}
          step={0.05}
          onChange={(v) => onParamChange("thermalConductivity", v)}
        />
      </div>

      <div className="mt-6 p-3 bg-gray-800 rounded text-xs text-gray-400">
        <p className="mb-2">🔴 赤 = 熱源（下部中央）</p>
        <p className="mb-2">🔵 水色 = 冷却源（上部）</p>
        <p className="mb-2">💧 青 = 水（液体）</p>
        <p>☁️ 薄青 = 水蒸気</p>
      </div>
    </div>
  );
}
