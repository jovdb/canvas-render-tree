import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { ITransformConfig } from "../operations/transform";

export const TransformConfig: ItemConfigFn<ITransformConfig> = ({
  config,
  mutateConfig,
}) => {
  const { translateX = 0, translateY = 0, scale = 1 } = config;

  return (
    <div>
      <div>
        X:{" "}
        <input
          type="number"
          style={{ width: "4rem" }}
          value={translateX}
          onChange={(e) => {
            const newX = parseInt(e.target.value, 10);
            mutateConfig((draftConfig) => {
              draftConfig.translateX = newX;
            });
          }}
        />
      </div>
      <div>
        Y:{" "}
        <input
          type="number"
          style={{ width: "4rem" }}
          value={translateY}
          onChange={(e) => {
            const newY = parseInt(e.target.value, 10);
            mutateConfig((draftConfig) => {
              draftConfig.translateY = newY;
            });
          }}
        />
      </div>
      <div>
        Scale:{" "}
        <input
          type="number"
          style={{ width: "4rem" }}
          value={scale}
          step="0.01"
          onChange={(e) => {
            const newScale = parseFloat(e.target.value);
            mutateConfig((draftConfig) => {
              draftConfig.scale = newScale;
            });
          }}
        />
      </div>
    </div>
  );
};

addRendererConfig("transform", TransformConfig);
