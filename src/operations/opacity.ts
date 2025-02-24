import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";

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
});

export const drawOpacity: ItemDrawFn<IOpacityConfig> = (
  ctx,
  drawPrev,
  config,
  drawChildren
) => {
  drawPrev?.(ctx);
  if (drawChildren) ctx.save();
  ctx.globalAlpha = config.opacity;
  drawChildren?.(ctx);
  if (drawChildren) ctx.restore();
};
