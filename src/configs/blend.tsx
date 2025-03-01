import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IBlendConfig } from "../operations/blend";

const blendModes = [
  "source-over",
  "source-in",
  "source-out",
  "source-atop",
  "destination-over",
  "destination-in",
  "destination-out",
  "destination-atop",
  "lighter",
  "copy",
  "xor",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
];

export const BlendConfig: ItemConfigFn<IBlendConfig> = ({
  config,
  mutateConfig,
}) => {
  return (
    <div>
      BlendMode:{" "}
      <select
        value={config.blendMode}
        onChange={(e) => {
          const newValue = e.target.value as GlobalCompositeOperation;
          mutateConfig((draftConfig) => {
            draftConfig.blendMode = newValue;
          });
        }}
      >
        {blendModes.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
    </div>
  );
};

addRendererConfig("blend", BlendConfig);
