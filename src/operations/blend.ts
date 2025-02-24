import { IRenderItem, RenderTree } from "../canvas";

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

  draw(ctx, drawPrev, config, drawChildren) {
    function apply() {
      ctx.globalCompositeOperation = config.blendMode;
    }

    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    apply();
    drawChildren?.(ctx);
    if (drawChildren) ctx.restore();
  },
});
