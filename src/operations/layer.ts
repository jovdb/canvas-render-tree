import { getContext2d, IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { addRenderer } from "../renderers";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";

export interface ILayerConfig extends IConfig {}

const schema: OperationSchema<"layer"> = {
  name: "layer",
  description: "Group children on a new render layer",
  input: {
    description: "The input to draw on the new layer",
    required: true,
  },
};

export const draw: ItemDrawFn = (ctx, drawPrev, _config, drawInput) => {
  // first draw previous items
  drawPrev?.(ctx);

  // Create an offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = ctx.canvas.width;
  canvas.height = ctx.canvas.height;
  const childCtx = getContext2d(canvas, "layerCtx");

  // Draw children on the offscreen canvas
  drawInput?.(childCtx);

  // Draw new children context on the parent context
  ctx.drawImage(canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
};

/** Draw children on a new render layer */
export const create = (
  input: RenderTree,
): IRenderItem<ILayerConfig> => ({
  name: "layer",
  input,
});

const operation = {
  key: "layer",
  create,
  draw,
  schema,
} as const;
addOperation(operation);

addRenderer("layer", {
  draw,
});

// Backward compatibility
export const layer = create;

declare global {
  interface IOperations {
    layer: typeof create;
  }
}
