import { IRenderItem } from '../canvas';

export const invert = (): IRenderItem => ({
  name: 'invert',
  draw(ctx) {
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
  },
});
