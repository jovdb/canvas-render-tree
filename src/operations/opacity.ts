import { addOperation } from ".";
import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { OperationSchema } from "../schemas";

export interface IOpacityConfig {
  opacity: number;
}

const schema: OperationSchema<"opacity"> = {
  name: "opacity",
  description: "Draw each child with the given opacity",
  input: {
    required: true,
  },
  args: [],
};

export const draw: ItemDrawFn<IOpacityConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  // first draw previous items
  drawPrev?.(ctx);

  ctx.save();
  ctx.globalAlpha = config.opacity;
  drawInput?.(ctx);
  ctx.restore();
};

export const create = (
  opacity: number,
  /** When passed, only the children will have opacity */
  input?: RenderTree | undefined,
): IRenderItem<IOpacityConfig> => ({
  name: "opacity",
  config: { opacity },
  input,
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
