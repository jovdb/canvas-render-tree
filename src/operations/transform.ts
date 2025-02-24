import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";

export interface ITransformConfig {
  translateX?: number;
  translateY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
}

export const transform = (
  config: ITransformConfig,
  children: RenderTree
): IRenderItem => ({
  name: "transform",
  config,
  children,
});

export const drawTransform: ItemDrawFn<ITransformConfig> = (
  ctx,
  drawPrev,
  config,
  drawChildren
) => {
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

  drawPrev?.(ctx);
  if (drawChildren) ctx.save();
  apply();
  drawChildren?.(ctx);
  if (drawChildren) ctx.restore();
};
