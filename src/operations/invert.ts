import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

export const invert = (input: RenderTree): IRenderItem<undefined> => ({
  name: "invert",
  input,
});

export const draw: ItemDrawFn = (ctx, drawPrev, _config, drawInput) => {
  // first draw previous items
  drawPrev?.(ctx);

  function apply() {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
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

  if (drawInput) ctx.save();
  apply();
  drawInput?.(ctx);
  if (drawInput) ctx.restore();

  drawPrev?.(ctx);
};

addRenderer("invert", {
  draw,
});
