import { IRenderItem, ItemDrawFn } from "../canvas";
import { addRenderer } from "../renderers";

export interface IFillColorConfig {
  color: string;
}

export const fillColor = (color = "#FFF"): IRenderItem<IFillColorConfig> => ({
  name: "fillColor",
  config: {
    color,
  },
});

export const draw: ItemDrawFn<IFillColorConfig> = (ctx, drawPrev, config) => {
  drawPrev?.(ctx);
  ctx.fillStyle = config.color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

addRenderer("fillColor", {
  draw,
});
