import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

export interface IOpacityConfig {
  opacity: number;
}

export const opacity = (
  opacity: number,
  /** When passed, only the children will have opacity */
  children?: RenderTree | undefined,
): IRenderItem<IOpacityConfig> => ({
  name: "opacity",
  config: { opacity },
  children,
});

export const draw: ItemDrawFn<IOpacityConfig> = (
  ctx,
  drawPrev,
  config,
  drawChildren,
) => {
  drawPrev?.(ctx);
  ctx.save();
  ctx.globalAlpha = config.opacity;
  if (!drawChildren) {
    throw new Error("opacity requires children");
  }
  drawChildren?.(ctx);
  ctx.restore();
};

addRenderer("opacity", {
  draw,
});
