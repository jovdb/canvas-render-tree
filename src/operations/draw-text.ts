import { IRenderItem } from "../canvas";

/** draw Text on a canvas */
export const drawText = ({
  text,
  foregroundColor = "#000",
  fontSize = 16,
  fontFamilyName = "Arial",
  x = 0,
  y = 0,
}: {
  text: string;
  x?: number;
  y?: number;
  foregroundColor?: string;
  fontSize?: number;
  fontFamilyName?: string;
}): IRenderItem => ({
  name: "drawText",
  draw2(ctx, drawPrev) {
    drawPrev?.(ctx);
    ctx.fillStyle = foregroundColor;
    ctx.font = `${fontSize}px '${fontFamilyName}'`;
    ctx.fillText(text, x, y);
  },
});
