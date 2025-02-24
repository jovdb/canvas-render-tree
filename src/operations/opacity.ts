import { IRenderItem, RenderTree } from "../canvas";

export interface IOpacityConfig {
  opacity: number;
}

export const opacity = (
  opacity: number,
  /** When passed, only the children will have opacity */
  children?: RenderTree | undefined
): IRenderItem<IOpacityConfig> => ({
  name: "opacity",
  config: { opacity },
  children,

  draw(ctx, drawPrev, config, drawChildren) {
    function apply() {
      ctx.globalAlpha = config.opacity;
    }

    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    apply();
    drawChildren?.(ctx);
    if (drawChildren) ctx.restore();
  },
});
