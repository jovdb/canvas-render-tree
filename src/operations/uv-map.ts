import { getContext2d, IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

/**
 * Generates a 2048x2048 UV Identity Map as a lossless PNG Base64 Data URL.
 * * Color Mapping (Bottom-Left Origin):
 * - Top-Left:     [0, 255, 0]   (Green)
 * - Top-Right:    [255, 255, 0] (Yellow)
 * - Bottom-Left:  [0, 0, 0]     (Black)
 * - Bottom-Right: [255, 0, 0]   (Red)
 * 
 * Usage:
 * const uvMapBase64 = generateUVIdentityMap(2048);
 * console.log(uvMapBase64); // "data:image/png;base64,..."
 */
export function generateUVIdentityMap(resolution: number = 2048): string {
  // 1. Create an offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not obtain 2D canvas context.");
  }

  // 2. Allocate pixel data buffer
  const imgData = ctx.createImageData(resolution, resolution);
  const data = imgData.data;

  // 3. Populate pixel colors row by row
  for (let y = 0; y < resolution; y++) {
    // Invert Y so that y = 0 (top row) calculates the V coordinate for the top
    // (V = 1.0 -> 255), matching your topLeftColor = Green requirement.
    const v = (resolution - 1 - y) / (resolution - 1);
    const g = Math.round(v * 255);

    for (let x = 0; x < resolution; x++) {
      const u = x / (resolution - 1);
      const r = Math.round(u * 255);

      // Calculate 1D array index for RGBA
      const index = (y * resolution + x) * 4;

      data[index] = r; // Red (U)
      data[index + 1] = g; // Green (V)
      data[index + 2] = 0; // Blue
      data[index + 3] = 255; // Alpha (Fully Opaque)
    }
  }

  // 4. Write pixel data back to the canvas
  ctx.putImageData(imgData, 0, 0);

  // 5. Export as a 24-bit (plus alpha) lossless PNG data URL
  return canvas.toDataURL("image/png");
}

/*
function interpolateColor(
  topLeft: [number, number, number],
  topRight: [number, number, number],
  bottomLeft: [number, number, number],
  bottomRight: [number, number, number],
  u: number,
  v: number
): [number, number, number] {
  // Bilinear interpolation
  const top = topLeft.map((val, i) => val * (1 - u) + topRight[i] * u);
  const bottom = bottomLeft.map((val, i) => val * (1 - u) + bottomRight[i] * u);
  return top.map((val, i) => val * (1 - v) + bottom[i] * v) as [
    number,
    number,
    number
  ];
}
*/

/**
 * Voert een hoogwaardige UV-map transformatie uit op beelddata met behulp van
 * bilineaire interpolatie en gecorrigeerde sub-pixel uitlijning.
 *
 * @param sourceContext De 2D-context van de bronafbeelding (de textuur).
 * @param uvMapImageContext De 2D-context van de UV-map afbeelding.
 * @returns De gegenereerde ImageData met de toegepaste transformatie.
 */
function manipulateImageData(
  sourceContext: CanvasRenderingContext2D,
  uvMapImageContext: CanvasRenderingContext2D,
): ImageData {
  const destWidth = sourceContext.canvas.width;
  const destHeight = sourceContext.canvas.height;

  // Initialiseer de bestemmingsbuffer via een offscreen canvas
  const destinationCanvas = document.createElement("canvas");
  destinationCanvas.width = destWidth;
  destinationCanvas.height = destHeight;
  const destinationContext = getContext2d(destinationCanvas, "displacementCtx");
  const destinationImageData = destinationContext.getImageData(
    0,
    0,
    destWidth,
    destHeight,
  );
  const destData = destinationImageData.data;

  const sourceWidth = sourceContext.canvas.width;
  const sourceHeight = sourceContext.canvas.height;
  const sourceImageData = sourceContext.getImageData(
    0,
    0,
    sourceWidth,
    sourceHeight,
  );
  const srcData = sourceImageData.data;

  const uvMapWidth = uvMapImageContext.canvas.width;
  const uvMapHeight = uvMapImageContext.canvas.height;
  const uvMapImageData = uvMapImageContext.getImageData(
    0,
    0,
    uvMapWidth,
    uvMapHeight,
  );
  const uvData = uvMapImageData.data;

  const maxSourceX = sourceWidth - 1;
  const maxSourceY = sourceHeight - 1;

  // Pre-calculatie van multiplicatoren om delingen in de lus te voorkomen
  const inv255 = 1.0 / 255.0;

  for (let y = 0; y < destHeight; y++) {
    // Schaal de Y-coördinaat naar de resolutie van de UV-map
    const uvY = Math.min(
      uvMapHeight - 1,
      Math.floor((y / destHeight) * uvMapHeight),
    );
    const uvRowOffset = uvY * uvMapWidth;

    for (let x = 0; x < destWidth; x++) {
      const uvX = Math.min(
        uvMapWidth - 1,
        Math.floor((x / destWidth) * uvMapWidth),
      );

      // Bereken de index binnen de UV-map buffer
      const uvMapIndex = (uvRowOffset + uvX) * 4;

      // Normaliseer de U en V waarden naar een bereik van [0, 1]
      const u = uvData[uvMapIndex] * inv255;
      const v = uvData[uvMapIndex + 1] * inv255;
      const alphaMask = uvData[uvMapIndex + 3] * inv255; // Gebruikt voor anti-aliasing van de geometrierand

      // Sla de berekening over als de UV-pixel volledig transparant is (buiten de geometrie)
      if (alphaMask === 0) {
        const destIndex = (y * destWidth + x) * 4;
        destData[destIndex + 3] = 0; // Volledig transparant
        continue;
      }

      // Bereken de sub-pixelcoördinaten in de bronruimte
      const sourceX = u * maxSourceX;
      const sourceY = v * maxSourceY;

      // Bepaal de vier omliggende pixelcoördinaten voor de interpolatie
      const x0 = Math.floor(sourceX);
      const y0 = Math.floor(sourceY);
      const x1 = x0 < maxSourceX ? x0 + 1 : x0;
      const y1 = y0 < maxSourceY ? y0 + 1 : y0;

      // Bereken de fractionele interpolatiefactoren
      const tx = sourceX - x0;
      const ty = sourceY - y0;

      // Bereken de eendimensionale array-indices voor de vier omliggende pixels
      const idx00 = (y0 * sourceWidth + x0) * 4;
      const idx10 = (y0 * sourceWidth + x1) * 4;
      const idx01 = (y1 * sourceWidth + x0) * 4;
      const idx11 = (y1 * sourceWidth + x1) * 4;

      const destIndex = (y * destWidth + x) * 4;

      // Voer de bilineaire interpolatie uit voor elk van de vier kleurkanalen (RGBA)
      const w00 = (1 - tx) * (1 - ty);
      const w10 = tx * (1 - ty);
      const w01 = (1 - tx) * ty;
      const w11 = tx * ty;

      // Rood kanaal
      destData[destIndex] =
        srcData[idx00] * w00 +
        srcData[idx10] * w10 +
        srcData[idx01] * w01 +
        srcData[idx11] * w11;

      // Groen kanaal
      destData[destIndex + 1] =
        srcData[idx00 + 1] * w00 +
        srcData[idx10 + 1] * w10 +
        srcData[idx01 + 1] * w01 +
        srcData[idx11 + 1] * w11;

      // Blauw kanaal
      destData[destIndex + 2] =
        srcData[idx00 + 2] * w00 +
        srcData[idx10 + 2] * w10 +
        srcData[idx01 + 2] * w01 +
        srcData[idx11 + 2] * w11;

      // Alpha kanaal (gecombineerd met de optionele alpha-maskerwaarde van de UV-map)
      const interpolatedAlpha =
        srcData[idx00 + 3] * w00 +
        srcData[idx10 + 3] * w10 +
        srcData[idx01 + 3] * w01 +
        srcData[idx11 + 3] * w11;

      destData[destIndex + 3] = interpolatedAlpha * alphaMask;
    }
  }

  return destinationImageData;
}

/*
function createUVMapImageData(width: number, height: number): ImageData {
  const imageData = new ImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      imageData.data[index] = Math.floor((x / width) * 255); // u
      imageData.data[index + 1] = Math.floor((y / height) * 255); // v
      imageData.data[index + 2] = 0;
      imageData.data[index + 3] = 255;
    }
  }
  return imageData;
}
*/

export const uvMap = (uv: RenderTree): IRenderItem => ({
  name: "uvMap",
  config: {},
  input: uv,
});

export const draw: ItemDrawFn<undefined> = (
  ctx,
  drawPrev,
  _config,
  drawInput,
) => {
  // first draw previous items
  drawPrev?.(ctx);

  if (drawInput) ctx.save();

  // Create an offscreen canvas
  const uvCanvas = document.createElement("canvas");
  uvCanvas.width = ctx.canvas.width;
  uvCanvas.height = ctx.canvas.height;
  const uvCtx = getContext2d(uvCanvas, "uvMap");

  drawInput?.(uvCtx);

  const imageData = manipulateImageData(ctx, uvCtx);
  //const imageData = createUVMapImageData(ctx.canvas.width, ctx.canvas.height);
  ctx.putImageData(imageData, 0, 0);
  if (drawInput) ctx.restore();
  return this;
};

addRenderer("uvMap", {
  draw,
});
