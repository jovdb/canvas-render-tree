import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IBicubicGridConfig } from "../operations/bicubic-grid";

export const BicubicGridConfig: ItemConfigFn<IBicubicGridConfig> = ({
  config,
  mutateConfig,
}) => {
  const { debug = false } = config || {};

  return (
    <div>
      <div>
        debug:{" "}
        <input
          type="checkbox"
          checked={debug}
          onChange={(e) => {
            const newDebug = !!e.target.checked;
            mutateConfig((draftConfig) => {
              draftConfig.debug = newDebug;
            });
          }}
        />
      </div>
    </div>
  );
};

addRendererConfig("bicubicGrid", BicubicGridConfig);
