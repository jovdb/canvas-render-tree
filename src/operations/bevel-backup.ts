// import { getContext2d, IRenderItem } from '../canvas';
// import { drawKernel } from '../kernels';

// // Create a kernel: Example for bevelSize: 5
// // [0,   0,   0,   0,   0.5]
// // [0,   0,   0,   0.5, 1]
// // [0,   0,   0.5, 1,   1]
// // [0,   0.5, 1,   1,   1]
// // [0.5, 1,   1,   1,   1]
// // todo add angle
// function createBottomRightKernel(bevelSize: number) {
//   let kernel = [];
//   const length = bevelSize * 2 + 1;
//   for (let i = 0; i < length; i++) {
//     let row: number[] = [];
//     for (let j = 0; j < length; j++) {
//       let value = 0;
//       if (j === length - i - 1) value = 0.5;
//       if (j > length - i - 1) value = 1;
//       row.push(value);
//     }
//     kernel.push(row);
//   }

//   return kernel;
// }

// /**
//  * Perform bevel on everything already draw
//  * You can wrap it in a new layer to control bevel
//  */
// export const bevel = ({
//   bevelSize = 8,
//   shadowColor = [0, 0, 0, 192],
//   highlightColor = [255, 255, 255, 192],
//   onlyBevel = false,
//   debugKernel = false,
//   kernel = createBottomRightKernel(bevelSize),
// }: {
//   bevelSize?: number;
//   shadowColor?: [r: number, g: number, b: number, a?: number];
//   highlightColor?: [r: number, g: number, b: number, a?: number];
//   onlyBevel?: boolean;
//   debugKernel?: boolean;
//   /**
//    * Convolution Kernel to use
//    * https://docs.gimp.org/2.8/en/plug-in-convmatrix.html
//    */
//   kernel?: number[][];
// } = {}): IRenderItem => ({
//   name: 'bevel',
//   draw(ctx) {
//     function getPixelValue(
//       imageData: ImageData,
//       x: number,
//       y: number,
//       kernel: number[][]
//     ) {
//       const width = imageData.width;
//       const height = imageData.height;
//       const data = imageData.data;
//       const currentIndex = (y * width + x) * 4;

//       // Only inside, start from transparent and look for non-transparent
//       if (data[currentIndex + 3] === 0) return 0;

//       let value = 0;
//       let total = 0;
//       const distance = Math.floor(kernel.length / 2);

//       for (let dx = -distance; dx <= distance; dx++) {
//         for (let dy = -distance; dy <= distance; dy++) {
//           const nx = x + dx;
//           const ny = y + dy;

//           if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
//             const neighborIndex = (ny * width + nx) * 4;
//             const weight = kernel[dy + distance][dx + distance];
//             total += weight;

//             // Check if a neighbor has alpha
//             if (data[neighborIndex + 3] > 0)
//               value += (data[neighborIndex + 3] / 255) * weight;
//           }
//         }
//       }
//       const opacity = 255 / data[currentIndex + 3];
//       return 1 - (value / total) * opacity;
//     }

//     function getBevelData() {
//       const imageData = ctx.getImageData(
//         0,
//         0,
//         ctx.canvas.width,
//         ctx.canvas.height
//       );
//       const width = imageData.width;
//       const height = imageData.height;
//       const bevel = new ImageData(width, height);
//       const bevelData = bevel.data;

//       // const kernel = createBottomRightKernel(bevelSize);

//       for (let y = 0; y < height; y++) {
//         for (let x = 0; x < width; x++) {
//           const pixelIndex = (y * width + x) * 4;
//           const bevelStrength = getPixelValue(imageData, x, y, kernel); // Check if pixel is a bevel pixel

//           if (bevelStrength >= 0) {
//             bevelData[pixelIndex] = shadowColor[0] ?? 0;
//             bevelData[pixelIndex + 1] = shadowColor[1] ?? 0;
//             bevelData[pixelIndex + 2] = shadowColor[2] ?? 0;
//             bevelData[pixelIndex + 3] =
//               (shadowColor[3] ?? 255) *
//               bevelStrength *
//               (imageData.data[pixelIndex + 3] / 255);
//           }
//         }
//       }

//       return bevel;
//     }

//     if (debugKernel) {
//       drawKernel(ctx, kernel);
//       return;
//     }

//     const bevel = getBevelData();

//     if (onlyBevel) {
//       ctx.putImageData(bevel, 0, 0); // Put the ImageData onto the canvas
//     } else {
//       // Place imageData in a canvas so we can draw it
//       const canvas = document.createElement('canvas');
//       canvas.width = bevel.width;
//       canvas.height = bevel.height;
//       const ctx2 = getContext2d(canvas, 'bevelCtx');

//       ctx2.putImageData(bevel, 0, 0); // Put the ImageData onto the canvas

//       // Use drawImage because we want to multiply the bevel over the image
//       ctx.drawImage(canvas, 0, 0);
//     }
//   },
// });
