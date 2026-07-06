import { addOperation, IOperation } from ".";
import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { ItemConfigFn } from "../configs";
import { OperationSchema } from "../schemas";
import { onChildCtx } from "./layer";

export interface IBlendConfig {
  blendMode: GlobalCompositeOperation;
}

const schema: OperationSchema<"blend"> = {
  name: "blend",
  getName: (config) =>
    config ? `blend: ${(config as IBlendConfig).blendMode}` : "blend",
  description: "Blend the rendering with the previous items",
  args: [
    {
      description: "Source of  blending",
      required: true,
    },
    {
      description: "Rendering to blend",
      required: true,
    },
  ],
} as const;

const create = (
  blendMode: GlobalCompositeOperation,
  /** When passed, only the children will be blended */
  input: RenderTree | undefined,
  toBlend: RenderTree | undefined,
): IRenderItem<IBlendConfig> => ({
  name: "blend",
  config: { blendMode },
  args: [input, toBlend],
});

const draw: ItemDrawFn<IBlendConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
  // first draw previous items
  drawPrev?.(ctx);

  onChildCtx(ctx, !!drawPrev, (drawCtx) => {
    drawArgs?.[0]?.(drawCtx);
    drawCtx.save();
    drawCtx.globalCompositeOperation = config.blendMode;
    drawArgs?.[1]?.(drawCtx);
    drawCtx.restore();
  });
};

const blendModes = [
  "source-over",
  "source-in",
  "source-out",
  "source-atop",
  "destination-over",
  "destination-in",
  "destination-out",
  "destination-atop",
  "lighter",
  "copy",
  "xor",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
];

export const BlendConfig: ItemConfigFn<IBlendConfig> = ({
  config,
  mutateConfig,
}) => {
  return (
    <div>
      BlendMode:{" "}
      <select
        value={config.blendMode}
        onChange={(e) => {
          const newValue = e.target.value as GlobalCompositeOperation;
          mutateConfig((draftConfig) => {
            draftConfig.blendMode = newValue;
          });
        }}
      >
        {blendModes.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
    </div>
  );
};

const operation: IOperation<"blend", IBlendConfig> = {
  key: "blend",
  schema,
  create,
  draw,
  configComponent: BlendConfig,
} as const;

addOperation(operation);

declare global {
  interface IOperations {
    [operation.key]: typeof create;
  }
}
