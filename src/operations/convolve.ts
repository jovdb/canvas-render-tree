import { IRenderItem } from '../canvas';
import { drawKernel, normalizeKernel } from '../kernels';

/** Same kernel will be used for all color channels */
/*
function applyConvolutionKernelOnPixel(
  imageData: ImageData,
  x: number,
  y: number,
  kernel: number[][]
) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  const distance = Math.floor(kernel.length / 2);

  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      const nx = x + dx;
      const ny = y + dy;

      // Should we add the possibility to choose what to do at the image border? : None, Loop, Clamp, Black, White
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const weight = kernel[dy + distance][dx + distance];
        const neighborIndex = (ny * width + nx) * 4;

        r += data[neighborIndex] * weight;
        g += data[neighborIndex + 1] * weight;
        b += data[neighborIndex + 2] * weight;
        a += data[neighborIndex + 3] * weight;
      }
    }
  }

  return [
    Math.min(255, Math.max(0, 255 * r)),
    Math.min(255, Math.max(0, 255 * g)),
    Math.min(255, Math.max(0, 255 * b)),
    Math.min(255, Math.max(0, 255 * a)),
  ];
}
*/

function applyKernel(
  imageData: ImageData,
  kernel: number[][],
  /** Extra factor to multiply */
  multiply = 1,
) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const newImageData = new ImageData(width, height);
  const newData = newImageData.data;
  const radius = Math.floor(kernel.length / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = x + kx;
          const ny = y + ky;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const kernelValue = kernel[ky + radius][kx + radius] * multiply;
            const index = (ny * width + nx) * 4;
            r += data[index] * kernelValue;
            g += data[index + 1] * kernelValue;
            b += data[index + 2] * kernelValue;
            a += data[index + 3] * kernelValue;
          }
        }
      }
      const index = (y * width + x) * 4;
      newData[index] = r;
      newData[index + 1] = g;
      newData[index + 2] = b;
      newData[index + 3] = a;
    }
  }
  return newImageData;
}

/**
 * Apply a convolution kernel on an image
 * You can wrap it in a new layer to control the input image to target
 */
export const convolve = ({
  kernel,
  debugKernel = false,
  normalize = false,
  multiply = 1,
}: {
  /**
   * Convolution Kernel to use
   * https://docs.gimp.org/2.10/en/gimp-filter-convolution-matrix.html
   * https://setosa.io/ev/image-kernels
   */
  kernel: number[][];
  debugKernel?: boolean;
  normalize?: boolean;
  multiply?: number;
}): IRenderItem => ({
  name: 'convolve',
  draw(ctx, drawPrev) {
    drawPrev?.(ctx);
    function getBevelData() {
      const imageData = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
      return applyKernel(imageData, kernel, multiply);
    }

    if (normalize) normalizeKernel(kernel);

    if (debugKernel) {
      drawKernel(ctx, kernel);
      return;
    }

    const newImageData = getBevelData();
    ctx.putImageData(newImageData, 0, 0); // Put the ImageData onto the canvas
  },
});
