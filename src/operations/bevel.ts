import { getContext2d, IRenderItem } from '../canvas';
import { drawKernel, guassianBlurKernel } from '../kernels';

type RGBA = [r: number, g: number, b: number, a?: number];

// todo
//--------
// bump map
// normal vector
// displacement map
// https://dsp.stackexchange.com/questions/530/bitmap-alpha-bevel-algorithm

/*
// Create a kernel: Example for bevelSize: 5
// [0,   0,   0,   0,   0.5]
// [0,   0,   0,   0.5, 1]
// [0,   0,   0.5, 1,   1]
// [0,   0.5, 1,   1,   1]
// [0.5, 1,   1,   1,   1]
// todo add angle
function createBottomRightKernel(bevelSize: number) {
  let kernel = [];
  const length = bevelSize * 2 + 1;
  for (let i = 0; i < length; i++) {
    let row: number[] = [];
    for (let j = 0; j < length; j++) {
      let value = 0;
      if (j === length - i - 1) value = 0.5;
      if (j > length - i - 1) value = 1;
      row.push(value);
    }
    kernel.push(row);
  }

  return kernel;
}
*/

function blendColors(color1: RGBA, color2: RGBA): RGBA {
  // Extract the RGBA components from the colors
  const [r1, g1, b1, a1 = 255] = color1;
  const [r2, g2, b2, a2 = 255] = color2;

  // Normalize the alpha values to the range [0, 1]
  const alpha1 = a1 / 255;
  const alpha2 = a2 / 255;

  // Calculate the resulting alpha
  const outAlpha = alpha1 + alpha2 * (1 - alpha1);

  // Calculate the resulting color components
  const outR = Math.round(
    (r1 * alpha1 + r2 * alpha2 * (1 - alpha1)) / outAlpha
  );
  const outG = Math.round(
    (g1 * alpha1 + g2 * alpha2 * (1 - alpha1)) / outAlpha
  );
  const outB = Math.round(
    (b1 * alpha1 + b2 * alpha2 * (1 - alpha1)) / outAlpha
  );

  // Return the blended color as an RGBA byte array
  return [outR, outG, outB, Math.round(outAlpha * 255)];
}

/** Apply kernel on 1 pixel */
function getPixelValue(
  imageData: ImageData,
  x: number,
  y: number,
  kernel: number[][]
) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const currentIndex = (y * width + x) * 4;

  // Only for non-transparent pxels, start from transparent and look for non-transparent
  if (data[currentIndex + 3] === 0) return 0;

  let value = 0;
  let total = 0;
  const distance = Math.floor(kernel.length / 2);

  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIndex = (ny * width + nx) * 4;
        const weight = kernel[dy + distance][dx + distance];
        total += weight;

        // Check if a neighbor has alpha
        if (data[neighborIndex + 3] > 0)
          value += (data[neighborIndex + 3] / 255) * weight;
      }
    }
  }
  return 1 - value / total;
}

/**
 * Perform bevel on everything already draw
 * You can wrap it in a new layer to control bevel
 */
export const bevel = ({
  bevelSize = 6,
  shadowColor = [0, 0, 0, 192],
  highlightColor = [255, 255, 255, 192],
  onlyBevel = false,
  debugKernel = false,
}: {
  bevelSize?: number;
  shadowColor?: RGBA;
  highlightColor?: RGBA;
  onlyBevel?: boolean;
  debugKernel?: boolean;
  /**
   * Convolution Kernel to use
   * https://docs.gimp.org/2.8/en/plug-in-convmatrix.html
   */
  kernel?: number[][];
} = {}): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
    // Create 2 kernels, for top/left and bottom/right edge
    const highlightKernel = guassianBlurKernel(
      Math.round(bevelSize*0.8),
      bevelSize * 0.3 ,
      -0.5
    );

    const shadowKernel = guassianBlurKernel(bevelSize, bevelSize / 3, 0.5);

    if (debugKernel) {
      drawKernel(ctx, highlightKernel);
      return;
    }

    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const width = imageData.width;
    const height = imageData.height;
    const bevel = new ImageData(width, height);
    const bevelData = bevel.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const shadowStrength = getPixelValue(imageData, x, y, shadowKernel);
        const highlightStrength = getPixelValue(
          imageData,
          x,
          y,
          highlightKernel
        ); // Check if pixel is a bevel pixel

        if (shadowStrength >= 0 || highlightStrength >= 0) {
          const sColor = [
            shadowColor[0],
            shadowColor[1],
            shadowColor[2],
            ((shadowColor[3] ?? 255) *
              shadowStrength *
              imageData.data[pixelIndex + 3]) /
              255,
          ] as RGBA;

          const hColor = [
            highlightColor[0],
            highlightColor[1],
            highlightColor[2],
            ((highlightColor[3] ?? 255) *
              highlightStrength *
              imageData.data[pixelIndex + 3]) /
              255,
          ] as RGBA;

          // Blend colors
          const color = blendColors(sColor, hColor);

          bevelData[pixelIndex] = color[0] ?? 0;
          bevelData[pixelIndex + 1] = color[1] ?? 0;
          bevelData[pixelIndex + 2] = color[2] ?? 0;
          bevelData[pixelIndex + 3] = color[3] ?? 255;
        }
      }
    }

    if (onlyBevel) {
      ctx.putImageData(bevel, 0, 0); // Put the ImageData onto the canvas
    } else {
      // Crate a new canvas that we can use as image so we can mix it on top, not replace
      const canvas = document.createElement('canvas');
      canvas.width = bevel.width;
      canvas.height = bevel.height;

      const bevelCtx = getContext2d(canvas, 'bevelCtx');
      bevelCtx.putImageData(bevel, 0, 0); // Put the ImageData onto the canvas

      // Use drawImage because we want to multiply the bevel over the image
      ctx.drawImage(canvas, 0, 0);
    }
  },
});
