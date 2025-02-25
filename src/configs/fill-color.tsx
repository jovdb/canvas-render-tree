import { ItemConfigFn } from "../canvas";
import { IFillColorConfig } from "../operations/fill-color";

export const FillColorConfig: ItemConfigFn<IFillColorConfig> = ({
  config,
  mutateConfig,
}) => {
  return (
    <div>
      Fill Color:{" "}
      <input
        value={config.color}
        onChange={(e) => {
          mutateConfig((draft) => {
            draft.color = e.target.value;
          });
        }}
      />
    </div>
  );
};
