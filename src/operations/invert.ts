import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

export const invert = (children: RenderTree): IRenderItem<undefined> => ({
  name: "invert",
  children,
});

export const draw: ItemDrawFn = (ctx, drawPrev, _config, drawChildren) => {
  function apply() {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Update pixel data
      data[i] = 255 - r;
      data[i + 1] = 255 - g;
      data[i + 2] = 255 - b;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  drawPrev?.(ctx);
  if (drawChildren) ctx.save();
  apply();
  drawChildren?.(ctx);
  if (drawChildren) ctx.restore();

  drawPrev?.(ctx);
};

addRenderer("invert", {
  draw,
});
