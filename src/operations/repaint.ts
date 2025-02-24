import { IRenderItem } from "../canvas";

/**
 * Repaint pixels based on transparency
 * Same as blend("source-in")
 */
export const repaint = (
  /** Repaint with
   * 1 draw operation required, bundle in layer if needed
   */
  repaintWith: [IRenderItem],
): IRenderItem => ({
  name: "repaint",
  children: repaintWith,
  draw(ctx, drawPrev, _config, drawChildren) {
    function apply() {
      ctx.globalCompositeOperation = "source-in";
    }

    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    apply();
    drawChildren?.(ctx);
    if (drawChildren) ctx.restore();
  },
});
