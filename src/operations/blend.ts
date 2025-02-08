import { IRenderItem, RenderTree } from "../canvas";

export const blend = (
  blendMode: GlobalCompositeOperation,
  /** When passed, only the children will be blended */
  children?: RenderTree | undefined
): IRenderItem => ({
  name: "blend",
  children,

  draw(ctx, drawPrev, drawChildren) {
    function apply() {
      ctx.globalCompositeOperation = blendMode;
    }

    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    apply();
    drawChildren?.(ctx);
    if (drawChildren) ctx.restore();
  },
});
