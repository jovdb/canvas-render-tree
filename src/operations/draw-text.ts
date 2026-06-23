import { IRenderItem, ItemDrawFn } from "../canvas";
import { addRenderer } from "../renderers";

export interface IDrawTextConfig {
  text: string;
  x?: number;
  y?: number;
  foregroundColor?: string;
  fontSize?: number;
  fontFamilyName?: string;
  isBold?: boolean;
  isItalic?: boolean;
}

/** draw Text on a canvas */
export const drawText = (config: IDrawTextConfig): IRenderItem => ({
  name: "drawText",
  config,
});

export const draw: ItemDrawFn<IDrawTextConfig> = (ctx, drawPrev, config) => {
  // first draw previous items
  drawPrev?.(ctx);

  const {
    text,
    foregroundColor = "#000",
    fontSize = 16,
    fontFamilyName = "Arial",
    isBold = false,
    isItalic = false,
    x = 0,
    y = 0,
  } = config;

  ctx.fillStyle = foregroundColor;
  ctx.font = `${isBold ? "bold" : ""} ${
    isItalic ? "italic" : ""
  }${fontSize}px '${fontFamilyName}'`;
  ctx.fillText(text, x, y);
};

addRenderer("drawText", {
  draw,
});
