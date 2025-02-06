import { IRenderItem } from "../canvas";

export const fillColor = (color = "#FFF"): IRenderItem => ({
  name: 'fillColor',
  draw(ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },
});