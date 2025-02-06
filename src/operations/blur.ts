import { IRenderItem } from "../canvas";

// Function to create a Gaussian kernel
function createGaussianKernel(radius: number, sigma: number) {
  const kernel = [];
  const size = radius * 2 + 1;
  let sum = 0;

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const exponent = -(x * x + y * y) / (2 * sigma * sigma);
      const weight = Math.exp(exponent) / (2 * Math.PI * sigma * sigma);
      kernel.push(weight);
      sum += weight;
    }
  }

  // Normalize the kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  return { kernel, size };
}

export const blur = ({
  radius = 5,
  sigma = 2,
}: { radius?: number; sigma?: number } = {}): IRenderItem => ({
  name: "blur",
  draw2(ctx, drawPrev) {
    drawPrev?.(ctx);
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const output = new ImageData(width, height);
    const outputData = output.data;

    const { kernel, size } = createGaussianKernel(radius, sigma);

    // Apply the kernel to each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          a = 0;

        // Convolve the kernel
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const pixelX = Math.min(Math.max(x + kx, 0), width - 1);
            const pixelY = Math.min(Math.max(y + ky, 0), height - 1);
            const kernelIndex = (ky + radius) * size + (kx + radius);
            const pixelIndex = (pixelY * width + pixelX) * 4;

            r += data[pixelIndex] * kernel[kernelIndex];
            g += data[pixelIndex + 1] * kernel[kernelIndex];
            b += data[pixelIndex + 2] * kernel[kernelIndex];
            a += data[pixelIndex + 3] * kernel[kernelIndex];
          }
        }

        // Set the output pixel
        const outputIndex = (y * width + x) * 4;
        outputData[outputIndex] = r;
        outputData[outputIndex + 1] = g;
        outputData[outputIndex + 2] = b;
        outputData[outputIndex + 3] = a;
      }
    }

    ctx.putImageData(output, 0, 0);
  },
});
