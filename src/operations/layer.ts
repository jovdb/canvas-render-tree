import { getContext2d, IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

/**
 * Draw children on a new render layer
 * This can be useful to scope input
 */
export const layer = (children: RenderTree): IRenderItem => ({
  name: "layer",
  children,
});

export const draw: ItemDrawFn = (ctx, drawPrev, _config, drawInput) => {
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

addRenderer("layer", {
  draw,
});
