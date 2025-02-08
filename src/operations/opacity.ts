import { IRenderItem, RenderTree } from "../canvas";

export const opacity = (
  opacity: number,
  /** When passed, only the children will have opacity */
  children?: RenderTree | undefined
): IRenderItem => ({
  name: "opacity",
  children,

  draw(ctx, drawPrev, drawChildren) {
    function apply() {
      ctx.globalAlpha = opacity;
    }

    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    apply();
    drawChildren?.(ctx);
    if (drawChildren) ctx.restore();
  },
});
