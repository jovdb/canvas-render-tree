import { ItemConfigFn } from "../canvas";
import { IFillColorConfig } from "../operations/fill-color";

export const FillColorConfig: ItemConfigFn<IFillColorConfig> = ({
    config,
    onChange,
  }) => {
    return (
      <div>
        Fill Color:{" "}
        <input
          value={config.color}
          onChange={(e) => {
            onChange({ ...config, color: e.target.value });
          }}
        />
      </div>
    );
  };