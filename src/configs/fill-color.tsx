import { addRendererConfig } from ".";
import { ItemConfigFn } from "../canvas";
import { IFillColorConfig } from "../operations/fill-color";
import { ColorConfig } from "./color";

export const FillColorConfig: ItemConfigFn<IFillColorConfig> = ({
  config,
  mutateConfig,
}) => {
  return (
    <div>
      Fill Color:
      <ColorConfig
        color={config.color}
        onChange={(newColor) => {
          mutateConfig((draftConfig) => {
            draftConfig.color = newColor;
          });
        }}
      />
    </div>
  );
};

addRendererConfig("fillColor", FillColorConfig);
