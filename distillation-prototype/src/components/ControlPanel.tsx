"use client";

import { SimParams, SubstanceProps, FixedSubstanceProps, CellKey, CELL_KEYS } from "@/lib/simulation";
import { ParamSlider } from "./ParamSlider";

// Short labels for matrix display
const CELL_LABELS: Record<CellKey, string> = {
  "A:liquid": "AL",
  "A:gas": "AG",
  "B:liquid": "BL",
  "B:gas": "BG",
  "wall:liquid": "W",
  "air:gas": "Air",
};

interface ControlPanelProps {
  params: SimParams;
  running: boolean;
  showTemp: boolean;
  onParamChange: (key: keyof SimParams, value: number) => void;
  onSubstanceChange: (substance: "A" | "B", key: keyof SubstanceProps, value: number) => void;
  onFixedSubstanceChange: (substance: "wall" | "air", key: keyof FixedSubstanceProps, value: number) => void;
  onTensionChange: (from: CellKey, to: CellKey, value: number) => void;
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
  onFixedSubstanceChange,
  onTensionChange,
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
        <p className="text-xs text-gray-500 mt-2">液体:</p>
        <ParamSlider
          label="比重(液)"
          value={params.substanceA.liquidDensity}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "liquidDensity", v)}
        />
        <ParamSlider
          label="熱伝導率(液)"
          value={params.substanceA.liquidThermalConductivity}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "liquidThermalConductivity", v)}
        />
        <ParamSlider
          label="比熱容量(液)"
          value={params.substanceA.liquidHeatCapacity}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "liquidHeatCapacity", v)}
        />
        <p className="text-xs text-gray-500 mt-2">気体:</p>
        <ParamSlider
          label="比重(気)"
          value={params.substanceA.gasDensity}
          min={0.001}
          max={0.1}
          step={0.001}
          onChange={(v) => onSubstanceChange("A", "gasDensity", v)}
        />
        <ParamSlider
          label="熱伝導率(気)"
          value={params.substanceA.gasThermalConductivity}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "gasThermalConductivity", v)}
        />
        <ParamSlider
          label="比熱容量(気)"
          value={params.substanceA.gasHeatCapacity}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={(v) => onSubstanceChange("A", "gasHeatCapacity", v)}
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
        <p className="text-xs text-gray-500 mt-2">液体:</p>
        <ParamSlider
          label="比重(液)"
          value={params.substanceB.liquidDensity}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "liquidDensity", v)}
        />
        <ParamSlider
          label="熱伝導率(液)"
          value={params.substanceB.liquidThermalConductivity}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "liquidThermalConductivity", v)}
        />
        <ParamSlider
          label="比熱容量(液)"
          value={params.substanceB.liquidHeatCapacity}
          min={0.01}
          max={1}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "liquidHeatCapacity", v)}
        />
        <p className="text-xs text-gray-500 mt-2">気体:</p>
        <ParamSlider
          label="比重(気)"
          value={params.substanceB.gasDensity}
          min={0.001}
          max={0.1}
          step={0.001}
          onChange={(v) => onSubstanceChange("B", "gasDensity", v)}
        />
        <ParamSlider
          label="熱伝導率(気)"
          value={params.substanceB.gasThermalConductivity}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "gasThermalConductivity", v)}
        />
        <ParamSlider
          label="比熱容量(気)"
          value={params.substanceB.gasHeatCapacity}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={(v) => onSubstanceChange("B", "gasHeatCapacity", v)}
        />

        {/* Wall */}
        <h2 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1 mt-6">
          壁（熱導体）
        </h2>
        <ParamSlider
          label="熱伝導率"
          value={params.wall.thermalConductivity}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onFixedSubstanceChange("wall", "thermalConductivity", v)}
        />
        <ParamSlider
          label="比熱容量"
          value={params.wall.heatCapacity}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => onFixedSubstanceChange("wall", "heatCapacity", v)}
        />

        {/* Air */}
        <h2 className="text-sm font-semibold text-gray-500 border-b border-gray-700 pb-1 mt-6">
          空気（断熱材）
        </h2>
        <ParamSlider
          label="熱伝導率"
          value={params.air.thermalConductivity}
          min={0.01}
          max={0.3}
          step={0.01}
          onChange={(v) => onFixedSubstanceChange("air", "thermalConductivity", v)}
        />
        <ParamSlider
          label="比熱容量"
          value={params.air.heatCapacity}
          min={0.01}
          max={0.3}
          step={0.01}
          onChange={(v) => onFixedSubstanceChange("air", "heatCapacity", v)}
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

        {/* Interface Tension Matrix */}
        <h2 className="text-sm font-semibold text-purple-400 border-b border-gray-700 pb-1 mt-6">
          界面活性度マトリックス
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          値が大きい = 反発が強い = 混ざりにくい
        </p>

        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="p-1"></th>
                {CELL_KEYS.map((key) => (
                  <th key={key} className="p-1 text-gray-400 font-normal">
                    {CELL_LABELS[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CELL_KEYS.map((rowKey, rowIdx) => (
                <tr key={rowKey}>
                  <td className="p-1 text-gray-400">{CELL_LABELS[rowKey]}</td>
                  {CELL_KEYS.map((colKey, colIdx) => (
                    <td key={colKey} className="p-0.5">
                      {rowIdx === colIdx ? (
                        <span className="text-gray-600 block text-center">-</span>
                      ) : rowIdx < colIdx ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={params.interfaceTension[rowKey][colKey]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onTensionChange(rowKey, colKey, val);
                          }}
                          className="w-10 px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-center text-gray-200"
                        />
                      ) : (
                        <span className="text-gray-600 block text-center text-[10px]">
                          {params.interfaceTension[rowKey][colKey].toFixed(1)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-600 mt-1">
          AL=液A, AG=気A, BL=液B, BG=気B, W=壁, Air=空気
        </p>
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
