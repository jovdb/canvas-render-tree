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
  draw(ctx, drawPrev, drawChildren) {
    function apply() {
      // scale
      if (typeof scaleX === "number" || typeof scaleY === "number")
        ctx.scale(scaleX ?? 1, scaleY ?? 1);

      // translate
      if (typeof translateX === "number" || typeof translateY === "number")
        ctx.translate(translateX ?? 0, translateY ?? 0);
    }

    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    apply();
    drawChildren?.(ctx);
    if (drawChildren) ctx.restore();
  },
});
