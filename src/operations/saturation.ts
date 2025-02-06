import { IRenderItem } from "../canvas";

// Helper function to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

// Helper function to convert HSL to RGB
function hslToRgb(h: number, s: number, l: number) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

/** Pass 0 for grayscale */
export const saturation = ({
  factor = 0,
}: { factor?: number } = {}): IRenderItem => ({
  name: "saturation",
  draw2(ctx, drawPrev) {
    drawPrev?.(ctx);
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

      // Convert RGB to HSL
      const [h, s, l] = rgbToHsl(r, g, b);

      // Adjust saturation
      const newSaturation = Math.min(1, Math.max(0, s * factor));

      // Convert HSL back to RGB
      const [newR, newG, newB] = hslToRgb(h, newSaturation, l);

      // Update pixel data
      data[i] = newR;
      data[i + 1] = newG;
      data[i + 2] = newB;
    }

    ctx.putImageData(imageData, 0, 0);
  },
});
