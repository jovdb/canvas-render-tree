import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IBevelConfig } from "../operations/bevel";

export const BevelConfig: ItemConfigFn<IBevelConfig> = ({
  config,
  mutateConfig,
}) => {
  const { bevelSize = 6 } = config;
  return (
    <div>
      Bevel size:{" "}
      <input
        type="number"
        min="0"
        max="50"
        value={bevelSize?.toString()}
        onChange={(e) => {
          const value = parseInt(e.target.value);
          mutateConfig((draftConfig) => {
            draftConfig.bevelSize = value;
          });
        }}
      />
    </div>
  );
};

addRendererConfig("bevel", BevelConfig);
