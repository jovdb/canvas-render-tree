import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IShadowConfig } from "../operations/shadow";

export const ShadowConfig: ItemConfigFn<IShadowConfig> = ({
  config,
  mutateConfig,
}) => {
  const { shadowOffsetX = 0, shadowOffsetY = 0 } = config;
  return (
    <>
      <div>
        Shadow offset X:{" "}
        <input
          type="number"
          min="-50"
          max="50"
          value={shadowOffsetX?.toString()}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            mutateConfig((draftConfig) => {
              draftConfig.shadowOffsetX = value;
            });
          }}
        />
      </div>
      <div>
        Shadow offset Y:{" "}
        <input
          type="number"
          min="-50"
          max="50"
          value={shadowOffsetY?.toString()}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            mutateConfig((draftConfig) => {
              draftConfig.shadowOffsetY = value;
            });
          }}
        />
      </div>
    </>
  );
};

addRendererConfig("shadow", ShadowConfig);
