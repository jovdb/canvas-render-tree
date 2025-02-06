import { IRenderItem, RenderTree } from "../canvas";

export const blend = (
  blendMode: GlobalCompositeOperation,
  /** When passed, only the children will be blended */
  children?: RenderTree | undefined
): IRenderItem => ({
  name: 'blend',
  children,

  draw(ctx, drawChildren) {
    function apply() {
      ctx.globalCompositeOperation = blendMode;
    }

    if (!drawChildren) {
      // Set for next items added
      apply();
    } else {
      // Only set for the children
      ctx.save();
      apply();
      drawChildren(ctx);
      ctx.restore();
    }
  },
});