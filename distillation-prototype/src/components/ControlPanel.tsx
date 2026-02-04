"use client";

import { SimParams, SubstanceProps } from "@/lib/simulation";
import { ParamSlider } from "./ParamSlider";

interface ControlPanelProps {
  params: SimParams;
  running: boolean;
  showTemp: boolean;
  onParamChange: (key: keyof SimParams, value: number) => void;
  onSubstanceChange: (substance: "A" | "B", key: keyof SubstanceProps, value: number) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onToggleShowTemp: (show: boolean) => void;
}

export function ControlPanel({
  params,
  running,
  showTemp,
  onParamChange,
  onSubstanceChange,
  onToggleRunning,
  onReset,
  onToggleShowTemp,
}: ControlPanelProps) {
  return (
    <div className="w-80 bg-[#161b22] border-l border-gray-800 p-4 overflow-y-auto">
      <h1 className="text-xl font-bold mb-4 text-cyan-400">蒸留シミュレータ</h1>

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
        {/* Substance A (Alcohol-like) */}
        <h2 className="text-sm font-semibold text-orange-400 border-b border-gray-700 pb-1">
          物質A（アルコール的）
        </h2>

        <ParamSlider
          label="沸点"
          value={params.substanceA.boilingPoint}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "boilingPoint", v)}
        />
        <ParamSlider
          label="潜熱閾値"
          value={params.substanceA.latentHeatThreshold}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "latentHeatThreshold", v)}
        />
        <ParamSlider
          label="比重"
          value={params.substanceA.density}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "density", v)}
        />
        <ParamSlider
          label="熱伝導率"
          value={params.substanceA.thermalConductivity}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "thermalConductivity", v)}
        />
        <ParamSlider
          label="比熱容量"
          value={params.substanceA.heatCapacity}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "heatCapacity", v)}
        />

        {/* Substance B (Water-like) */}
        <h2 className="text-sm font-semibold text-blue-400 border-b border-gray-700 pb-1 mt-6">
          物質B（水的）
        </h2>

        <ParamSlider
          label="沸点"
          value={params.substanceB.boilingPoint}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "boilingPoint", v)}
        />
        <ParamSlider
          label="潜熱閾値"
          value={params.substanceB.latentHeatThreshold}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "latentHeatThreshold", v)}
        />
        <ParamSlider
          label="比重"
          value={params.substanceB.density}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "density", v)}
        />
        <ParamSlider
          label="熱伝導率"
          value={params.substanceB.thermalConductivity}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "thermalConductivity", v)}
        />
        <ParamSlider
          label="比熱容量"
          value={params.substanceB.heatCapacity}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "heatCapacity", v)}
        />

        {/* System Parameters */}
        <h2 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-1 mt-6">
          システム設定
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
          label="冷却係数"
          value={params.coolingCoefficient}
          min={0.001}
          max={0.1}
          step={0.001}
          onChange={(v) => onParamChange("coolingCoefficient", v)}
        />
      </div>

      <div className="mt-6 p-3 bg-gray-800 rounded text-xs text-gray-400">
        <p className="mb-1">🟠 オレンジ = 液体A（アルコール）</p>
        <p className="mb-1">🟡 薄オレンジ = 気体A（アルコール蒸気）</p>
        <p className="mb-1">🔵 青 = 液体B（水）</p>
        <p className="mb-1">💠 薄青 = 気体B（水蒸気）</p>
        <p>⬛ 灰 = 壁（下部=熱源）</p>
      </div>
    </div>
  );
}
