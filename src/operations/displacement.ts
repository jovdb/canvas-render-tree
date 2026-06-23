import { getContext2d, IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

// displacement map

/**
 *
 * Displacement Map:
 * Uses the red channel for X displacement
 * Uses the green channel for Y displacement
 * 128 = neutral value (no displacement)
 * Values < 128 = negative displacement
 * Values > 128 = positive displacement
 */
function applyDisplacementMap(
  srcCtx: CanvasRenderingContext2D,
  displacementCtx: CanvasRenderingContext2D,
  strength = 10,
) {
  const srcImageData = srcCtx.getImageData(
    0,
    0,
    srcCtx.canvas.width,
    srcCtx.canvas.height,
  );
  const srcPixels = srcImageData.data;

  const displacementImageData = displacementCtx.getImageData(
    0,
    0,
    displacementCtx.canvas.width,
    displacementCtx.canvas.height,
  );
  const displacementPixels = displacementImageData.data;

  // Create an offscreen canvas
  const destinationCanvas = document.createElement("canvas");
  destinationCanvas.width = srcCtx.canvas.width;
  destinationCanvas.height = srcCtx.canvas.height;
  const destinationContext = getContext2d(destinationCanvas, "displacementCtx");
  const destinationImageData = destinationContext.getImageData(
    0,
    0,
    destinationContext.canvas.width,
    destinationContext.canvas.height,
  );

  for (let y = 0; y < srcCtx.canvas.height; y++) {
    for (let x = 0; x < srcCtx.canvas.width; x++) {
      // Get displacement values (using red and green channels)
      const displacementIdx = (y * displacementCtx.canvas.width + x) * 4;
      const dx = (displacementPixels[displacementIdx] - 128) * (strength / 128);
      const dy =
        (displacementPixels[displacementIdx + 1] - 128) * (strength / 128);

      // Calculate source coordinates
      const srcX = x + dx;
      const srcY = y + dy;

      // Get source pixel (nearest neighbor)
      if (
        srcX >= 0 &&
        srcX < srcImageData.width &&
        srcY >= 0 &&
        srcY < srcImageData.height
      ) {
        const srcIdx =
          (Math.floor(srcY) * srcImageData.width + Math.floor(srcX)) * 4;
        const tempIdx = (y * srcImageData.width + x) * 4;

        destinationImageData.data[tempIdx] = srcPixels[srcIdx]; // R
        destinationImageData.data[tempIdx + 1] = srcPixels[srcIdx + 1]; // G
        destinationImageData.data[tempIdx + 2] = srcPixels[srcIdx + 2]; // B
        destinationImageData.data[tempIdx + 3] = srcPixels[srcIdx + 3]; // A
      }
    }
  }

  return destinationImageData;
}

export interface IDisplacementConfig {
  strength?: number;
}

export const displacement = (
  strength: number,
  displacement: RenderTree,
): IRenderItem => ({
  name: "displacement",
  config: { strength },
  children: displacement,
});

export const draw: ItemDrawFn<IDisplacementConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  const { strength } = config;
  drawPrev?.(ctx);
  if (drawInput) ctx.save();

  // Create an offscreen canvas
  const displacementCanvas = document.createElement("canvas");
  displacementCanvas.width = ctx.canvas.width;
  displacementCanvas.height = ctx.canvas.height;
  const displacementCtx = getContext2d(displacementCanvas, "displacementCtx");

  drawInput?.(displacementCtx);

  const imageData = applyDisplacementMap(ctx, displacementCtx, strength);
  ctx.putImageData(imageData, 0, 0);

  if (drawInput) ctx.restore();
  return this;
};

addRenderer("displacement", {
  draw,
});
