import { IRenderItem } from '../canvas';

export const bevel1 = (): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
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

    // Define a convolution kernel for bevel effect
    // const kernel = [
    //   [-1, -1, 0],
    //   [-1, 1, 1],
    //   [0, 1, 1],
    // ];
    const kernel = [
      [-1, -1, -0.5, 0, 0],
      [-1, -0.5, 0, 0, 0],
      [-0.5, -0.5, 0, 0.5, 0.5],
      [0, 0, 0, 1, 1],
      [0, 0, 0.5, 1, 1],
    ];

    const kernelSize = kernel[0].length;
    const halfKernel = Math.floor(kernelSize / 2);

    // Apply the convolution kernel to each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        // Convolve the kernel with the image
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelX = x + kx - halfKernel;
            const pixelY = y + ky - halfKernel;

            // Handle edge cases by clamping to the image boundaries
            if (
              pixelX >= 0 &&
              pixelX < width &&
              pixelY >= 0 &&
              pixelY < height
            ) {
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const weight = kernel[ky][kx];

              r += data[pixelIndex] * weight;
              g += data[pixelIndex + 1] * weight;
              b += data[pixelIndex + 2] * weight;
            }
          }
        }

        // Clamp the values to 0-255
        const outputIndex = (y * width + x) * 4;
        outputData[outputIndex] = Math.min(255, Math.max(0, r)); // Red
        outputData[outputIndex + 1] = Math.min(255, Math.max(0, g)); // Green
        outputData[outputIndex + 2] = Math.min(255, Math.max(0, b)); // Blue
        outputData[outputIndex + 3] = data[outputIndex + 3]; // Alpha (unchanged)
      }
    }

    ctx.putImageData(output, 0, 0);
  },
});

export const bevel2 = ({
  bevelSize = 1,
}: {
  bevelSize?: number;
} = {}): IRenderItem => ({
  name: 'bevel',
  draw(ctx, drawChildren) {
    drawChildren?.(ctx);
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const output = ctx.createImageData(width, height); // Create output ImageData
    const outputData = output.data;

    // Create a dynamic convolution kernel based on bevelSize
    const kernelSize = bevelSize * 2 + 1; // Kernel size is always odd
    const kernel = createBevelKernel(kernelSize);

    const halfKernel = Math.floor(kernelSize / 2);

    // Apply the convolution kernel to each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        // Convolve the kernel with the image
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelX = x + kx - halfKernel;
            const pixelY = y + ky - halfKernel;

            // Handle edge cases by clamping to the image boundaries
            if (
              pixelX >= 0 &&
              pixelX < width &&
              pixelY >= 0 &&
              pixelY < height
            ) {
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const weight = kernel[ky][kx];

              r += data[pixelIndex] * weight;
              g += data[pixelIndex + 1] * weight;
              b += data[pixelIndex + 2] * weight;
            }
          }
        }

        // Clamp the values to 0-255
        const outputIndex = (y * width + x) * 4;
        outputData[outputIndex] = Math.min(255, Math.max(0, r)); // Red
        outputData[outputIndex + 1] = Math.min(255, Math.max(0, g)); // Green
        outputData[outputIndex + 2] = Math.min(255, Math.max(0, b)); // Blue
        outputData[outputIndex + 3] = data[outputIndex + 3]; // Alpha (unchanged)
      }
    }
    ctx.putImageData(output, 0, 0);
  },
});

export const bevel3 = (): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = ctx.createImageData(width, height); // Create output ImageData
    const outputData = output.data;

    const bevelSize = 10;

    function createBevelKernel(size: number) {
      const kernel = [];
      const center = Math.floor(size / 2);

      // Create a kernel with a gradient from -1 to 1
      for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
          // Calculate distance from the center
          const dx = x - center;
          const dy = y - center;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Normalize the distance to create a gradient
          const value = (distance / center) * 2 - 1;
          row.push(value);
        }
        kernel.push(row);
      }

      return kernel;
    }

    // Create a dynamic convolution kernel based on bevelSize
    const kernelSize = bevelSize * 2 + 1; // Kernel size is always odd
    const kernel = createBevelKernel(kernelSize);

    const halfKernel = Math.floor(kernelSize / 2);

    // Apply the convolution kernel to each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        // Convolve the kernel with the image
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelX = x + kx - halfKernel;
            const pixelY = y + ky - halfKernel;

            // Handle edge cases by clamping to the image boundaries
            if (
              pixelX >= 0 &&
              pixelX < width &&
              pixelY >= 0 &&
              pixelY < height
            ) {
              const pixelIndex = (pixelY * width + pixelX) * 4;
              const weight = kernel[ky][kx] / kernelSize / 10;

              r += data[pixelIndex] * weight;
              g += data[pixelIndex + 1] * weight;
              b += data[pixelIndex + 2] * weight;
            }
          }
        }

        // Clamp the values to 0-255
        const outputIndex = (y * width + x) * 4;
        outputData[outputIndex] = Math.min(255, Math.max(0, r)); // Red
        outputData[outputIndex + 1] = Math.min(255, Math.max(0, g)); // Green
        outputData[outputIndex + 2] = Math.min(255, Math.max(0, b)); // Blue
        outputData[outputIndex + 3] = data[outputIndex + 3]; // Alpha (unchanged)
      }
    }

    ctx.putImageData(output, 0, 0);
  },
});

function applyConvolutionBevel(imageData: ImageData, kernel: number[][]) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new ImageData(width, height);
  const outputData = output.data;

  const kernelSize = kernel.length;
  const halfKernel = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const pixelX = x + kx - halfKernel;
          const pixelY = y + ky - halfKernel;

          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const pixelIndex = (pixelY * width + pixelX) * 4;
            const weight = kernel[ky][kx];

            r += data[pixelIndex] * weight;
            g += data[pixelIndex + 1] * weight;
            b += data[pixelIndex + 2] * weight;
          }
        }
      }

      const outputIndex = (y * width + x) * 4;
      outputData[outputIndex] = Math.min(255, Math.max(0, r)); // Red
      outputData[outputIndex + 1] = Math.min(255, Math.max(0, g)); // Green
      outputData[outputIndex + 2] = Math.min(255, Math.max(0, b)); // Blue
      outputData[outputIndex + 3] = data[outputIndex + 3]; // Alpha
    }
  }
  return output;
}

export const bevel4 = ({
  bevelSize = 8,
  angleDeg = 135,
}: {
  bevelSize?: number;
  angleDeg?: number;
} = {}): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    function createBevelKernel2(bevelSize: number, angle: number) {
      const kernelSize = bevelSize * 2 + 1; // Kernel size is always odd
      const kernel = [];
      const center = Math.floor(kernelSize / 2); // Center of the kernel
      const radians = (angle * Math.PI) / 180; // Convert angle to radians

      // Precompute sine and cosine of the angle for performance
      const cosAngle = Math.cos(radians);
      const sinAngle = Math.sin(radians);

      // Create the kernel
      for (let y = 0; y < kernelSize; y++) {
        const row = [];
        for (let x = 0; x < kernelSize; x++) {
          // Calculate the relative position from the center
          const dx = x - center;
          const dy = y - center;

          // Project the position onto the light direction vector
          const projection = dx * cosAngle + dy * sinAngle;

          // Normalize the projection to create a gradient
          const maxDistance = Math.sqrt(center * center + center * center);
          const value = (projection / maxDistance) * 2; // Scale to [-1, 1]

          row.push(value);
        }
        kernel.push(row);
      }

      return kernel;
    }

    const kernel = createBevelKernel2(bevelSize, angleDeg);
    const newImageData = applyConvolutionBevel(imageData, kernel);

    ctx.putImageData(newImageData, 0, 0);
  },
});

export const bevel5 = ({
  bevelSize = 5,
}: {
  bevelSize?: number;
} = {}): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    function createBevelKernel3(size: number) {
      const kernel = [];
      const sigma = size / 3; // Standard deviation for Gaussian distribution
      const sum = 2 * Math.PI * sigma * sigma;

      for (let y = -size; y <= size; y++) {
        const row = [];
        for (let x = -size; x <= size; x++) {
          const exponent = -((x * x + y * y) / (2 * sigma * sigma));
          row.push(Math.exp(exponent) / sum);
        }
        kernel.push(row);
      }
      return kernel;
    }
    const kernel = createBevelKernel3(bevelSize);
    const newImageData = applyConvolutionBevel(imageData, kernel);

    ctx.putImageData(newImageData, 0, 0);
  },
});

export const bevel6 = ({
  bevelSize = 10,
}: {
  bevelSize?: number;
} = {}): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    // const bevelSize = 5; // Adjust bevel size
    const angle = 45; // Light angle (in degrees)

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = ctx.createImageData(width, height); // Create output ImageData

    function createBevelKernel(bevelSize, gradientAngle) {
      const angleRad = (gradientAngle * Math.PI) / 180;
      const kernelSize = 2 * bevelSize + 1;
      const kernel = new Array(kernelSize * kernelSize).fill(0);

      for (let y = -bevelSize; y <= bevelSize; y++) {
        for (let x = -bevelSize; x <= bevelSize; x++) {
          const distance = Math.sqrt(x * x + y * y);
          if (distance <= bevelSize) {
            const weight = Math.cos(angleRad) * x + Math.sin(angleRad) * y;
            kernel[(y + bevelSize) * kernelSize + (x + bevelSize)] = weight;
          }
        }
      }

      return kernel;
    }

    // Create the bevel kernel
    const kernel = createBevelKernel(bevelSize, angle);
    const kernelSize = 2 * bevelSize + 1;

    for (let i = 0; i < data.length; i += 4) {
      const px = (i / 4) % width;
      const py = Math.floor(i / 4 / width);

      let sum = 0;
      for (let ky = -bevelSize; ky <= bevelSize; ky++) {
        for (let kx = -bevelSize; kx <= bevelSize; kx++) {
          const x = px + kx;
          const y = py + ky;

          if (x >= 0 && x < width && y >= 0 && y < height) {
            const offset = (y * width + x) * 4;
            const weight =
              kernel[(ky + bevelSize) * kernelSize + (kx + bevelSize)];
            sum += data[offset] * weight;
          }
        }
      }

      const lightColor = [255, 255, 255]; // Light color (R, G, B)
      const shadowColor = [0, 0, 0]; // Shadow color (R, G, B)

      const lightFactor = Math.max(0, sum);
      const shadowFactor = Math.min(0, sum);

      output.data[i] =
        data[i] + lightFactor * lightColor[0] + shadowFactor * shadowColor[0];
      output.data[i + 1] =
        data[i + 1] +
        lightFactor * lightColor[1] +
        shadowFactor * shadowColor[1];
      output.data[i + 2] =
        data[i + 2] +
        lightFactor * lightColor[2] +
        shadowFactor * shadowColor[2];
      output.data[i + 3] = data[i + 3];
    }

    ctx.putImageData(output, 0, 0);
  },
});

export const bevel7 = (): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    function createBevelKernel(
      size,
      angle,
      lightColor,
      shadowColor,
      sigma = 1.0
    ) {
      const kernel = [];
      const center = Math.floor(size / 2); // Center of the kernel
      const radians = (angle * Math.PI) / 180; // Convert angle to radians

      // Precompute sine and cosine of the angle for performance
      const cosAngle = Math.cos(radians);
      const sinAngle = Math.sin(radians);

      // Calculate the maximum possible distance from the center
      const maxDistance = Math.sqrt(center * center + center * center);

      // Create the kernel
      for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
          // Calculate the relative position from the center
          const dx = x - center;
          const dy = y - center;

          // Project the position onto the light direction vector
          const projection = dx * cosAngle + dy * sinAngle;

          // Normalize the projection to create a gradient
          const value = (projection / maxDistance) * 2; // Scale to [-1, 1]

          // Apply Gaussian distribution to the value
          const gaussianValue = gaussian(value, sigma);

          // Interpolate between lightColor and shadowColor based on the Gaussian value
          const color = interpolateColor(
            lightColor,
            shadowColor,
            gaussianValue
          );

          row.push(color);
        }
        kernel.push(row);
      }

      return kernel;
    }

    // Gaussian distribution function
    function gaussian(x, sigma) {
      return Math.exp(-(x * x) / (2 * sigma * sigma));
    }

    // Interpolate between two colors based on a gradient value
    function interpolateColor(color1, color2, t) {
      const r = Math.round(color1.r + (color2.r - color1.r) * t);
      const g = Math.round(color1.g + (color2.g - color1.g) * t);
      const b = Math.round(color1.b + (color2.b - color1.b) * t);
      return { r, g, b };
    }

    const bevelSize = 18; // Kernel size (e.g., 5x5)
    const angle = 225; // Light source angle in degrees
    const lightColor = { r: 0, g: 0, b: 255 }; // White
    const shadowColor = { r: 255, g: 0, b: 0 }; // Black
    const sigma = 0.8; // Spread of the Gaussian distribution

    const kernel = createBevelKernel(
      bevelSize,
      angle,
      lightColor,
      shadowColor,
      sigma
    );

    function applyConvolutionBevel(imageData, kernel) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      const output = new ImageData(width, height);
      const outputData = output.data;

      const kernelSize = kernel.length;
      const halfKernel = Math.floor(kernelSize / 2);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0,
            g = 0,
            b = 0;

          for (let ky = 0; ky < kernelSize; ky++) {
            for (let kx = 0; kx < kernelSize; kx++) {
              const pixelX = x + kx - halfKernel;
              const pixelY = y + ky - halfKernel;

              if (
                pixelX >= 0 &&
                pixelX < width &&
                pixelY >= 0 &&
                pixelY < height
              ) {
                const pixelIndex = (pixelY * width + pixelX) * 4;
                const weight = kernel[ky][kx];

                r += (data[pixelIndex] * weight.r) / 255;
                g += (data[pixelIndex + 1] * weight.g) / 255;
                b += (data[pixelIndex + 2] * weight.b) / 255;
              }
            }
          }

          r /= kernelSize * 10;
          g /= kernelSize * 10;
          b /= kernelSize * 10;

          if (x === 111 && y === 180) console.log({ r, g, b, k: kernel[1][2] });
          const outputIndex = (y * width + x) * 4;
          outputData[outputIndex] = Math.min(255, Math.max(0, r)); // Red
          outputData[outputIndex + 1] = Math.min(255, Math.max(0, g)); // Green
          outputData[outputIndex + 2] = Math.min(255, Math.max(0, b)); // Blue
          outputData[outputIndex + 3] = data[outputIndex + 3]; // Alpha
        }
      }

      return output;
    }

    const output = applyConvolutionBevel(imageData, kernel);
    ctx.putImageData(output, 0, 0);
  },
});

export const bevel8 = (): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
    function createGaussianKernel(radius) {
      const size = 2 * radius + 1;
      const kernel = Array(size)
        .fill(null)
        .map(() => Array(size));
      const sigma = radius / 3; // Adjust sigma for blur strength

      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          const exponent = -(x * x + y * y) / (2 * sigma * sigma);
          kernel[y + radius][x + radius] =
            Math.exp(exponent) / (2 * Math.PI * sigma * sigma);
        }
      }

      // Normalize the kernel
      let sum = 0;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          sum += kernel[i][j];
        }
      }
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          kernel[i][j] /= sum;
        }
      }

      return kernel;
    }

    function applyBlur(data, width, height, kernel, radius) {
      const tempCanvas = new ImageData(width, height);
      const tempData = tempCanvas.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          let r = 0,
            g = 0,
            b = 0,
            a = 0;

          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const nx = x + kx;
              const ny = y + ky;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const kernelValue = kernel[ky + radius][kx + radius];
                const neighborIndex = (ny * width + nx) * 4;
                r += data[neighborIndex] * kernelValue;
                g += data[neighborIndex + 1] * kernelValue;
                b += data[neighborIndex + 2] * kernelValue;
                a += data[neighborIndex + 3] * kernelValue;
              }
            }
          }
          tempData[pixelIndex] = r;
          tempData[pixelIndex + 1] = g;
          tempData[pixelIndex + 2] = b;
          tempData[pixelIndex + 3] = a;
        }
      }
      for (let i = 0; i < data.length; i++) {
        data[i] = tempData[i];
      }
    }

    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    const bevelSize = 20;
    const angle = 45;
    const elevation = 10; // Adjust elevation for light height
    const lightIntensity = 0.8;
    const shadowColor = { r: 0, g: 0, b: 0 };
    const highlightColor = { r: 1, g: 1, b: 1 }; // Adjust highlight color (0-1 range)

    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    const canvas = document.createElement('canvas');
    const ctx2 = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    ctx2.putImageData(imageData, 0, 0);

    const blurredData = ctx2.getImageData(0, 0, width, height);
    const blurRadius = 10; // Adjust blur radius as needed
    const blurKernel = createGaussianKernel(blurRadius);

    applyBlur(blurredData.data, width, height, blurKernel, blurRadius);

    const bumpMap = ctx2.getImageData(0, 0, width, height); // Reuse blurred image as bump map

    const lightX = bevelSize + Math.cos((angle * Math.PI) / 180) * bevelSize;
    const lightY = bevelSize + Math.sin((angle * Math.PI) / 180) * bevelSize;
    const lightZ = elevation; // Elevation controls the light's height

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;

        // Sobel operator for normal calculation (simplified)
        const dx =
          (x > 0 ? bumpMap.data[(y * width + x - 1) * 4] : 0) -
          (x < width - 1 ? bumpMap.data[(y * width + x + 1) * 4] : 0);
        const dy =
          (y > 0 ? bumpMap.data[((y - 1) * width + x) * 4] : 0) -
          (y < height - 1 ? bumpMap.data[((y + 1) * width + x) * 4] : 0);

        const nx = -dx; // Simplified normal calculation
        const ny = -dy;
        const nz = 1; // Assuming a flat surface for simplicity

        const lightDirX = lightX - x;
        const lightDirY = lightY - y;
        const lightDirZ = lightZ; // Z component for light direction

        const dotProduct =
          (nx * lightDirX + ny * lightDirY + nz * lightDirZ) /
          (Math.sqrt(nx * nx + ny * ny + nz * nz) *
            Math.sqrt(
              lightDirX * lightDirX +
                lightDirY * lightDirY +
                lightDirZ * lightDirZ
            ));
        const diffuseLight = Math.max(0, dotProduct) * lightIntensity;

        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];

        // Apply lighting and shadow/highlight
        let finalR = Math.max(
          0,
          Math.min(
            255,
            r * (1 + diffuseLight * highlightColor.r) +
              shadowColor.r * (1 - diffuseLight)
          )
        );
        let finalG = Math.max(
          0,
          Math.min(
            255,
            g * (1 + diffuseLight * highlightColor.g) +
              shadowColor.g * (1 - diffuseLight)
          )
        );
        let finalB = Math.max(
          0,
          Math.min(
            255,
            b * (1 + diffuseLight * highlightColor.b) +
              shadowColor.b * (1 - diffuseLight)
          )
        );

        data[pixelIndex] = finalR;
        data[pixelIndex + 1] = finalG;
        data[pixelIndex + 2] = finalB;
      }
    }

    ctx.putImageData(bumpMap, 0, 0);
  },
});

export const bevel = (): IRenderItem => ({
  name: 'bevel',
  draw(ctx) {
    function isEdgePixel(
      imageData: ImageData,
      x: number,
      y: number,
      bevelWidth: number
    ) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue; // Skip the current pixel

          const nx = x + i;
          const ny = y + j;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const currentIndex = (y * width + x) * 4;
            const neighborIndex = (ny * width + nx) * 4;
            if (
              data[currentIndex] !== data[neighborIndex] ||
              data[currentIndex + 1] !== data[neighborIndex + 1] ||
              data[currentIndex + 2] !== data[neighborIndex + 2]
            )
              return true;
          }
        }
      }
      return false;
    }

    function createInnerBevelMask(imageData: ImageData, bevelWidth: number) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      const mask = new ImageData(width, height);
      const maskData = mask.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          const isEdge = isEdgePixel(imageData, x, y, bevelWidth); // Check if pixel is near the edge

          if (isEdge) {
            maskData[pixelIndex] = 255;
            maskData[pixelIndex + 1] = 255;
            maskData[pixelIndex + 2] = 255;
            maskData[pixelIndex + 3] = 255;
          } else {
            maskData[pixelIndex] = 0;
            maskData[pixelIndex + 1] = 0;
            maskData[pixelIndex + 2] = 0;
            maskData[pixelIndex + 3] = 255;
          }
        }
      }
      return mask;
    }

    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    const bevelWidth = 10;

    // Create a new layer/canvas
    const canvas = document.createElement('canvas');
    const ctx2 = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    ctx2.putImageData(imageData, 0, 0);

    // 1. Create a mask for the inner bevel
    const maskData = ctx2.getImageData(0, 0, width, height);
    const mask = createInnerBevelMask(maskData, bevelWidth);
    ctx2.putImageData(mask, 0, 0); // Draw the mask onto the canvas for blurring

    /*
    ctx.putImageData(
      ctx2.getImageData(0, 0, ctx2.canvas.width, ctx2.canvas.height),
      0,
      0
    );*/

    // ctx.drawImage(ctx2.canvas, 0, 0);
  },
});
