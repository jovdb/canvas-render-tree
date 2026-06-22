import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IShadowConfig } from "../operations/shadow";

export const ShadowConfig: ItemConfigFn<IShadowConfig> = ({
  config,
  mutateConfig,
}) => {
  const { shadowOffsetX = 0, shadowOffsetY = 0, type = "outer" } = config;
  return (
    <>
      <div>
        Type:{" "}
        <select
          value={type}
          onChange={(e) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value = e.target.value as any;
            mutateConfig((draftConfig) => {
              draftConfig.type = value;
            });
          }}
        >
          <option value="outer">Outer</option>
          <option value="inner">Inner</option>
        </select>
      </div>
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
