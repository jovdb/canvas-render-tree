import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

export interface ITransformConfig {
  translateX?: number;
  translateY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
}

export const transform = (
  config: ITransformConfig,
  input: RenderTree,
): IRenderItem => ({
  name: "transform",
  config,
  input,
});

export const draw: ItemDrawFn<ITransformConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  // first draw previous items
  drawPrev?.(ctx);

  const {
    translateX,
    translateY,
    scale,
    scaleX = scale,
    scaleY = scale,
  } = config;

  function apply() {
    // scale
    if (typeof scaleX === "number" || typeof scaleY === "number")
      ctx.scale(scaleX ?? 1, scaleY ?? 1);

    // translate
    if (typeof translateX === "number" || typeof translateY === "number")
      ctx.translate(translateX ?? 0, translateY ?? 0);
  }

  if (drawInput) ctx.save();
  apply();
  drawInput?.(ctx);
  if (drawInput) ctx.restore();
};

addRenderer("transform", {
  draw,
});
