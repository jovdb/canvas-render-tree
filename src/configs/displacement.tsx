import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IDisplacementConfig } from "../operations/displacement";

export const DisplacementConfig: ItemConfigFn<IDisplacementConfig> = ({
  config,
  mutateConfig,
}) => {
  const { strength = 10 } = config;

  return (
    <div>
      <div>
        Strength:{" "}
        <input
          type="number"
          min="0"
          value={strength}
          onChange={(e) => {
            const newStrength = parseInt(e.target.value, 10);
            mutateConfig((draftConfig) => {
              draftConfig.strength = newStrength;
            });
          }}
        />
      </div>
    </div>
  );
};

addRendererConfig("displacement", DisplacementConfig);
