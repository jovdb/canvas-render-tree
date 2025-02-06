// import { IRenderItem } from '../canvas';
// import { drawKernel, kernels } from '../kernels';

// // TODO: https://dsp.stackexchange.com/questions/530/bitmap-alpha-bevel-algorithm

// export function createBevelKernel(radius = 8, angleDeg = 225) {
//   // Convert angle from degrees to radians
//   const angleRad = (angleDeg * Math.PI) / 180;

//   // Calculate kernel size
//   const kernelSize = 2 * radius + 1;

//   // Initialize the kernel as a 2D array
//   const kernel = new Array(kernelSize)
//     .fill(0)
//     .map(() => new Array(kernelSize).fill(0));

//   // Center of the kernel
//   const center = radius;

//   // Generate kernel values
//   for (let i = 0; i < kernelSize; i++) {
//     for (let j = 0; j < kernelSize; j++) {
//       // Calculate distance from the center
//       const dx = j - center;
//       const dy = i - center;

//       // Calculate the dot product with the light direction vector
//       const lightX = Math.cos(angleRad);
//       const lightY = Math.sin(angleRad);
//       const dotProduct = dx * lightX + dy * lightY;

//       // Assign kernel value based on the dot product
//       kernel[i][j] = dotProduct;
//     }
//   }

//   // Normalize the kernel to ensure the sum of absolute values is 1
//   const sumAbs = kernel.flat().reduce((sum, val) => sum + Math.abs(val), 0);
//   for (let i = 0; i < kernelSize; i++) {
//     for (let j = 0; j < kernelSize; j++) {
//       kernel[i][j] /= sumAbs;
//     }
//   }

//   return kernel;
// }

// export function createBevelKernelRound(radius = 8, angleDeg = 225) {
//   // Convert angle from degrees to radians
//   const angleRad = (angleDeg * Math.PI) / 180;

//   // Calculate kernel size
//   const kernelSize = 2 * radius + 1;

//   // Initialize the kernel as a 2D array
//   const kernel = new Array(kernelSize)
//     .fill(0)
//     .map(() => new Array(kernelSize).fill(0));

//   // Center of the kernel
//   const center = radius;

//   // Generate kernel values
//   for (let i = 0; i < kernelSize; i++) {
//     for (let j = 0; j < kernelSize; j++) {
//       // Calculate distance from the center
//       const dx = j - center;
//       const dy = i - center;

//       // Calculate the dot product with the light direction vector
//       const lightX = Math.cos(angleRad);
//       const lightY = Math.sin(angleRad);
//       const dotProduct = dx * lightX + dy * lightY;

//       // Assign kernel value based on the dot product
//       kernel[i][j] = dotProduct;
//     }
//   }

//   // Normalize the kernel to ensure the sum of absolute values is 1
//   const sumAbs = kernel.flat().reduce((sum, val) => sum + Math.abs(val), 0);
//   for (let i = 0; i < kernelSize; i++) {
//     for (let j = 0; j < kernelSize; j++) {
//       kernel[i][j] /= sumAbs;
//     }
//   }

//   return kernel;
// }

// function applyKernel(imageData: ImageData, kernel: number[][]) {
//   const width = imageData.width;
//   const height = imageData.height;
//   const data = imageData.data;
//   const newImageData = new ImageData(width, height);
//   const newData = newImageData.data;
//   const radius = Math.floor(kernel.length / 2);

//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       let r = 0,
//         g = 0,
//         b = 0,
//         a = 0;

//       for (let ky = -radius; ky <= radius; ky++) {
//         for (let kx = -radius; kx <= radius; kx++) {
//           const nx = x + kx;
//           const ny = y + ky;
//           if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
//             const kernelValue = kernel[ky + radius][kx + radius];
//             const index = (ny * width + nx) * 4;
//             r += data[index] * kernelValue;
//             g += data[index + 1] * kernelValue;
//             b += data[index + 2] * kernelValue;
//             a += data[index + 3] * kernelValue;
//           }
//         }
//       }
//       const index = (y * width + x) * 4;
//       newData[index] = r;
//       newData[index + 1] = g;
//       newData[index + 2] = b;
//       newData[index + 3] = a;
//     }
//   }
//   return newImageData;
// }

// // 3. Calculate Normals (using Sobel operator or gradient of a height map)
// //    This step is essential.  You need to approximate surface normals
// //    from the blurred image (which acts as a height map).  The shader
// //    example I provided earlier does this efficiently.  If you're working
// //    on the CPU (JavaScript), you'll need to implement the Sobel operator
// //    or a similar gradient calculation.

// function calculateNormals(imageData: ImageData) {
//   const width = imageData.width;
//   const height = imageData.height;
//   const data = imageData.data;
//   const normalsImageData = new ImageData(imageData.width, imageData.height);
//   const normalsData = normalsImageData.data;

//   function getIndex(x: number, y: number) {
//     return (y * width + x) * 4;
//   }

//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       // Simplified Sobel operator (can be improved)
//       const dx =
//         (x > 0 ? data[getIndex(x - 1, y)] : 0) -
//         (x < width - 1 ? data[getIndex(x + 1, y)] : 0);
//       const dy =
//         (y > 0 ? data[getIndex(x, y - 1)] : 0) -
//         (y < height - 1 ? data[getIndex(x, y - 1)] : 0);

//       const nx = -dx;
//       const ny = -dy;
//       const nz = 1; // Simplified (assuming a relatively flat surface)

//       const normal = normalize([nx, ny, nz]); // Normalize the normal

//       const lightX = 1;
//       const lightY = 1;
//       const lightZ = 1;

//       // Calculate light intensity (dot product of light and normal)
//       const lightIntensity = Math.max(
//         0,
//         lightX * normal.x + lightY * normal.y + lightZ * normal.z
//       );

//       const index = (y * width + x) * 3;
//       normalsData[index] = data[index] * lightIntensity;
//       normalsData[index + 1] = data[index + 1] * lightIntensity;
//       normalsData[index + 2] = data[index + 2] * lightIntensity;
//       normalsData[index + 3] = data[index + 3];
//     }
//   }
//   return normalsImageData;
// }

// function normalize(v: [number, number, number]) {
//   const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
//   return { x: v[0] / length, y: v[1] / length, z: v[2] / length };
// }

// /**
//  * Perform bevel on everything already draw
//  * You can wrap it in a new layer to control bevel
//  */
// export const bevel2 = ({
//   bevelSize = 8,
//   shadowColor = [0, 0, 0, 192],
//   highlightColor = [255, 255, 255, 192],
//   debugKernel = false,
// }: {
//   bevelSize?: number;
//   shadowColor?: [r: number, g: number, b: number, a?: number];
//   highlightColor?: [r: number, g: number, b: number, a?: number];
//   debugKernel?: boolean;
// } = {}): IRenderItem => ({
//   name: 'bevel2',
//   draw(ctx, drawPrev) {
//     const kernel = kernels.gaussianBlurKernel(bevelSize, bevelSize / 2);

//     drawPrev?.(ctx);
//     if (debugKernel) {
//       drawKernel(ctx, kernel);
//       return;
//     }

//     const imageData = ctx.getImageData(
//       0,
//       0,
//       ctx.canvas.width,
//       ctx.canvas.height
//     );
//     const blurred = applyKernel(imageData, kernel);

//     //const bevel = calculateNormals(blurred);

//     ctx.putImageData(blurred, 0, 0); // Put the ImageData onto the canvas
//   },
// });
