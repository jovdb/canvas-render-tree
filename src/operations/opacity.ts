import { addOperation } from ".";
import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { OperationSchema } from "../schemas";

export interface IOpacityConfig extends IConfig {
  opacity: number;
}

const schema: OperationSchema<"opacity"> = {
  name: "opacity",
  description: "Draw each child with the given opacity",
  getName: (config) =>
    config
      ? `opacity: ${Math.round(((config as IOpacityConfig).opacity ?? 0.5) * 100)}%`
      : "opacity",
  args: [
    {
      description: "Rendering to apply opacity to",
      required: true,
    },
  ],
};

export const draw: ItemDrawFn<IOpacityConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
  // first draw previous items
  drawPrev?.(ctx);

  ctx.save();
  ctx.globalAlpha = config.opacity ?? 0.5;
  drawArgs?.[0]?.(ctx);
  ctx.restore();
};

const create = (
  opacity: number = 0.5,
  /** When passed, only the children will have opacity */
  input: RenderTree | undefined,
): IRenderItem<IOpacityConfig> => ({
  name: "opacity",
  config: { opacity },
  args: [input],
});

const operation = {
  key: "opacity",
  create,
  draw,
  schema,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    opacity: typeof create;
  }
}
