import { ItemConfigFn } from "../configs";
import {
  IRaisedEdgeConfig,
  raisedEdgeDefaults,
} from "./raised-edge";

function updateNumber(
  mutateConfig: (mutate: (config: IRaisedEdgeConfig) => void) => void,
  key:
    | "width"
    | "strength"
    | "lightAngle"
    | "lightElevation"
    | "softness"
    | "highlightOpacity"
    | "shadowOpacity",
  value: number,
) {
  mutateConfig((draftConfig) => {
    draftConfig[key] = value;
  });
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}: {value.toFixed(step < 1 ? 2 : 0)}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
    </label>
  );
}

export const CommonRaisedControls: ItemConfigFn<IRaisedEdgeConfig> = ({
  config,
  mutateConfig,
}) => {
  const width = config.width ?? raisedEdgeDefaults.width;
  const strength = config.strength ?? raisedEdgeDefaults.strength;
  const lightAngle = config.lightAngle ?? raisedEdgeDefaults.lightAngle;
  const lightElevation =
    config.lightElevation ?? raisedEdgeDefaults.lightElevation;
  const softness = config.softness ?? raisedEdgeDefaults.softness;
  const highlightColor =
    config.highlightColor ?? raisedEdgeDefaults.highlightColor;
  const highlightOpacity =
    config.highlightOpacity ?? raisedEdgeDefaults.highlightOpacity;
  const shadowColor = config.shadowColor ?? raisedEdgeDefaults.shadowColor;
  const shadowOpacity = config.shadowOpacity ?? raisedEdgeDefaults.shadowOpacity;

  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <RangeControl
        label="Width (px)"
        value={width}
        min={1}
        max={50}
        step={1}
        onChange={(value) => updateNumber(mutateConfig, "width", value)}
      />
      <RangeControl
        label="Strength"
        value={strength}
        min={0}
        max={2}
        step={0.01}
        onChange={(value) => updateNumber(mutateConfig, "strength", value)}
      />
      <RangeControl
        label="Light angle"
        value={lightAngle}
        min={0}
        max={360}
        step={1}
        onChange={(value) => updateNumber(mutateConfig, "lightAngle", value)}
      />
      <RangeControl
        label="Light elevation"
        value={lightElevation}
        min={0}
        max={89}
        step={1}
        onChange={(value) =>
          updateNumber(mutateConfig, "lightElevation", value)
        }
      />
      <RangeControl
        label="Softness"
        value={softness}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => updateNumber(mutateConfig, "softness", value)}
      />
      <label>
        Highlight
        <input
          type="color"
          value={highlightColor}
          onChange={(event) =>
            mutateConfig((draftConfig) => {
              draftConfig.highlightColor = event.target.value;
            })
          }
        />
      </label>
      <RangeControl
        label="Highlight opacity"
        value={highlightOpacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) =>
          updateNumber(mutateConfig, "highlightOpacity", value)
        }
      />
      <label>
        Shadow
        <input
          type="color"
          value={shadowColor}
          onChange={(event) =>
            mutateConfig((draftConfig) => {
              draftConfig.shadowColor = event.target.value;
            })
          }
        />
      </label>
      <RangeControl
        label="Shadow opacity"
        value={shadowOpacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) =>
          updateNumber(mutateConfig, "shadowOpacity", value)
        }
      />
    </div>
  );
};
