import {
  IRenderItem,
  ItemDrawFn,
  OperationSchema,
  RenderTree,
} from "../canvas";
import { addRenderer } from "../renderers";

export interface IOpacityConfig {
  opacity: number;
}

export const opacitySchema: OperationSchema<"opacity"> = {
  name: "opacity",
  description: "Draw each child with the given opacity",
  input: {
    required: true,
  },
  args: [],
};

export const opacity = (
  opacity: number,
  /** When passed, only the children will have opacity */
  input?: RenderTree | undefined,
): IRenderItem<IOpacityConfig> => ({
  name: "opacity",
  config: { opacity },
  input,
});

export const draw: ItemDrawFn<IOpacityConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  drawPrev?.(ctx);
  ctx.save();
  ctx.globalAlpha = config.opacity;
  drawInput?.(ctx);
  ctx.restore();
};

addRenderer("opacity", {
  draw,
});
