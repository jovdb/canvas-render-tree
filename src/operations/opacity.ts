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
  input: undefined,
  renderArgs: [],
};

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
  drawInput,
) => {
  drawPrev?.(ctx);
  ctx.save();
  ctx.globalAlpha = config.opacity;
  if (!drawInput) {
    throw new Error("opacity requires children");
  }
  drawInput?.(ctx);
  ctx.restore();
};

addRenderer("opacity", {
  draw,
});
