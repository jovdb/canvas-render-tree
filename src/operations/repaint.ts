import { IRenderItem } from '../canvas';

/** Repaint pixels based on trnsparency */
export const repaint = (
  /** Repaint with
   * 1 draw operation required, bundle in layer if needed
   */
  repaintWith: [IRenderItem]
): IRenderItem => ({
  name: 'repaint',
  children: repaintWith,
  draw(ctx, drawPrev, drawChildren) {
    drawPrev?.(ctx);
    ctx.save();
    // Use alpha
    ctx.globalCompositeOperation = 'source-in';
    drawChildren?.(ctx);
    ctx.restore();
    return this;
  },
});
