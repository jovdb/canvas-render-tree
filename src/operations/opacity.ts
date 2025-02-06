import { IRenderItem, RenderTree } from '../canvas';

export const opacity = (
  opacity: number,
  /** When passed, only the children will have opacity */
  children?: RenderTree | undefined
): IRenderItem => ({
  name: 'opacity',
  children,

  draw(ctx, drawChildren) {
    function apply() {
      ctx.globalAlpha = opacity;
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
