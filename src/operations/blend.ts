import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

export interface IBlendConfig {
  blendMode: GlobalCompositeOperation;
}

export const blend = (
  blendMode: GlobalCompositeOperation,
  /** When passed, only the children will be blended */
  input?: RenderTree | undefined,
): IRenderItem<IBlendConfig> => ({
  name: "blend",
  config: { blendMode },
  input,
});

export const draw: ItemDrawFn<IBlendConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  // first draw previous items
  drawPrev?.(ctx);

  ctx.save();
  ctx.globalCompositeOperation = config.blendMode;
  drawInput?.(ctx);
  ctx.restore();
};

addRenderer("blend", {
  draw,
});
