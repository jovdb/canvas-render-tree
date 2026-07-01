import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";

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

export interface ISaturationConfig extends IConfig {
  factor?: number;
}

const schema: OperationSchema<"saturation"> = {
  name: "saturation",
  description: "Adjust image saturation (0 for grayscale)",
  getName: (config) =>
    config
      ? `saturation: ${Math.round(((config as ISaturationConfig).factor ?? 0) * 100)}%`
      : "saturation",
  args: [
    {
      description: "Rendering to adjust",
      required: true,
    },
  ],
};

export const draw: ItemDrawFn<ISaturationConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
  // first draw previous items
  drawPrev?.(ctx);

  const { factor = 0 } = config;

  function apply(offscreenCtx: CanvasRenderingContext2D) {
    const imageData = offscreenCtx.getImageData(
      0,
      0,
      offscreenCtx.canvas.width,
      offscreenCtx.canvas.height,
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

    offscreenCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offscreenCtx.canvas, 0, 0);
  }

  const drawInput = drawArgs?.[0];
  if (!drawInput?.length) return;

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = ctx.canvas.width;
  offscreenCanvas.height = ctx.canvas.height;
  const offscreenCtx = offscreenCanvas.getContext("2d");
  if (!offscreenCtx) return;

  // offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  drawInput(offscreenCtx);

  apply(offscreenCtx);
  
};

/** Adjust image saturation */
export const create = (
  config: ISaturationConfig = {},
  input?: RenderTree,
): IRenderItem<ISaturationConfig> => ({
  name: "saturation",
  config,
  args: [input ?? []],
});

const operation = {
  key: "saturation",
  create,
  draw,
  schema,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    saturation: typeof create;
  }
}
