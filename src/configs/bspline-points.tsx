import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IBSplinePointsConfig } from "../operations/bspline-points";

export const BSplinePointsConfig: ItemConfigFn<IBSplinePointsConfig> = ({
  config,
  mutateConfig,
}) => {
  const { strength = 1 } = config || {};

  return (
    <div>
      <div>
        Strength:{" "}
        <input
          type="number"
          min="0"
          step={0.1}
          max="20"
          value={strength}
          onChange={(e) => {
            const newStrength = parseFloat(e.target.value);
            mutateConfig((draftConfig) => {
              draftConfig.strength = newStrength;
            });
          }}
        />
      </div>
    </div>
  );
};

addRendererConfig("bSplinePoints", BSplinePointsConfig);
