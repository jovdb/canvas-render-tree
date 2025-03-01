import { IRenderItem, ItemDrawFn } from "../canvas";
import { addRenderer } from "../renderers";

export interface IDrawTextConfig {
  text: string;
  x?: number;
  y?: number;
  foregroundColor?: string;
  fontSize?: number;
  fontFamilyName?: string;
}

/** draw Text on a canvas */
export const drawText = (config: IDrawTextConfig): IRenderItem => ({
  name: "drawText",
  config,
});

export const draw: ItemDrawFn<IDrawTextConfig> = (ctx, drawPrev, config) => {
  const {
    text,
    foregroundColor = "#000",
    fontSize = 16,
    fontFamilyName = "Arial",
    x = 0,
    y = 0,
  } = config;
  drawPrev?.(ctx);
  ctx.fillStyle = foregroundColor;
  ctx.font = `${fontSize}px '${fontFamilyName}'`;
  ctx.fillText(text, x, y);
};

addRenderer("drawText", {
  draw,
});
