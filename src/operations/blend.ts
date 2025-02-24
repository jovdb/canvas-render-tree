import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";

export interface IBlendConfig {
  blendMode: GlobalCompositeOperation;
}

export const blend = (
  blendMode: GlobalCompositeOperation,
  /** When passed, only the children will be blended */
  children?: RenderTree | undefined
): IRenderItem<IBlendConfig> => ({
  name: "blend",
  config: { blendMode },
  children,
});

export const drawBlend: ItemDrawFn<IBlendConfig> = (
  ctx,
  drawPrev,
  config,
  drawChildren
) => {
  drawPrev?.(ctx);
  if (drawChildren) ctx.save();
  ctx.globalCompositeOperation = config.blendMode;
  drawChildren?.(ctx);
  if (drawChildren) ctx.restore();
};
