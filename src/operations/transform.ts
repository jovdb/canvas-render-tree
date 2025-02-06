import { IRenderItem, RenderTree } from "../canvas";

export const transform = (
  {
    translateX,
    translateY,
    scale,
    scaleX = scale,
    scaleY = scale,
  }: {
    translateX?: number;
    translateY?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
  },
  children: RenderTree
): IRenderItem => ({
  name: "translate",
  children,
  draw2(ctx, drawPrev, drawChildren) {
    drawPrev?.(ctx);
    ctx.save();

    // scale
    if (typeof scaleX === "number" || typeof scaleY === "number")
      ctx.scale(scaleX ?? 1, scaleY ?? 1);

    // translate
    if (typeof translateX === "number" || typeof translateY === "number")
      ctx.translate(translateX ?? 0, translateY ?? 0);

    drawChildren!(ctx);
    ctx.restore();
  },
});
