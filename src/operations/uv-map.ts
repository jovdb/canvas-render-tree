import { getContext2d, IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

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

function manipulateImageData(
  sourceContext: CanvasRenderingContext2D,
  uvMapImageContext: CanvasRenderingContext2D,
) {
  // Create an offscreen canvas
  const destinationCanvas = document.createElement("canvas");
  destinationCanvas.width = sourceContext.canvas.width;
  destinationCanvas.height = sourceContext.canvas.height;
  const destinationContext = getContext2d(destinationCanvas, "displacementCtx");
  const destWidth = destinationCanvas.width;
  const destHeight = destinationCanvas.height;
  const destinationImageData = destinationContext.getImageData(
    0,
    0,
    destWidth,
    destHeight,
  );

  const sourceWidth = sourceContext.canvas.width;
  const sourceHeight = sourceContext.canvas.height;
  const sourceImageData = sourceContext.getImageData(
    0,
    0,
    sourceWidth,
    sourceHeight,
  );

  const uvMapWidth = uvMapImageContext.canvas.width;
  const uvMapHeight = uvMapImageContext.canvas.height;
  const uvMapImageData = uvMapImageContext.getImageData(
    0,
    0,
    uvMapWidth,
    uvMapHeight,
  );

  // Define identity texture map colors
  // const topLeftColor: [number, number, number] = [0, 255, 0]; // Green
  // const topRightColor: [number, number, number] = [255, 255, 0]; // Yellow
  // const bottomLeftColor: [number, number, number] = [0, 0, 0]; // Black
  // const bottomRightColor: [number, number, number] = [255, 0, 0]; // Red

  for (let y = 0; y < destHeight; y++) {
    for (let x = 0; x < destWidth; x++) {
      const uvMapIndex = (y * uvMapWidth + x) * 4;
      const u = uvMapImageData.data[uvMapIndex] / 255;
      const v = uvMapImageData.data[uvMapIndex + 1] / 255;
      //const a = uvMapImageData.data[uvMapIndex + 3] / 255; // could be used for masking.

      // Determine source pixel coordinates based on UV map color
      /*
      const sourceColor = interpolateColor(
        topLeftColor,
        topRightColor,
        bottomLeftColor,
        bottomRightColor,
        u,
        v
      );
      */

      // Map the interpolated color back to a position in the source image
      // We use bilinear interpolation to find which point in source corresponds
      // to the current UV
      const sourceX = Math.floor(u * (sourceWidth - 1));
      const sourceY = Math.floor(v * (sourceHeight - 1));

      // Get the source pixel color, handle edge cases (clamp)
      const clampedSourceX = Math.max(0, Math.min(sourceWidth - 1, sourceX));
      const clampedSourceY = Math.max(0, Math.min(sourceHeight - 1, sourceY));
      const sourceIndex = (clampedSourceY * sourceWidth + clampedSourceX) * 4;

      // Copy the source pixel to the destination
      const destIndex = (y * destWidth + x) * 4;
      destinationImageData.data[destIndex] = sourceImageData.data[sourceIndex]; // Red
      destinationImageData.data[destIndex + 1] =
        sourceImageData.data[sourceIndex + 1]; // Green
      destinationImageData.data[destIndex + 2] =
        sourceImageData.data[sourceIndex + 2]; // Blue
      destinationImageData.data[destIndex + 3] =
        sourceImageData.data[sourceIndex + 3]; // Alpha
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

export const uvMap = (strength: number, uv: RenderTree): IRenderItem => ({
  name: "uvMap",
  config: { strength },
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
