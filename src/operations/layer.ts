import { getContext2d, IRenderItem, RenderTree } from "../canvas";

/**
 * Draw children on a new render layer
 * This can be usefull to scope input
 */
export const layer = (children: RenderTree): IRenderItem => ({
  name: "layer",
  children,
  draw2(ctx, drawPrev, drawChildren) {
    const canvas = document.createElement("canvas");
    canvas.width = ctx.canvas.width;
    canvas.height = ctx.canvas.height;
    const childCtx = getContext2d(canvas, "layerCtx");
    drawChildren?.(childCtx);

    drawPrev?.(ctx);
    // Draw new children context on the parent context
    ctx.drawImage(canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  },
});
