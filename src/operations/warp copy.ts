// import { IRenderItem } from "../canvas";

// type ControlPoint = [x: number, y: number];

// // https://demonstrations.wolfram.com/ImageWarping/
// // https://github.com/wxdrizzle/FreeFormDeformation-SketchDetection
// // https://chenxing.name/fun/imgwarp-js/
// // https://github.com/snorpey/distort-grid?tab=readme-ov-file
// // https://github.com/baltaazr/image-warper/blob/master/warp.js
// // Free-Form Deformation (FFD):

// function getSourcePixel(
//   x: number,
//   y: number,
//   controlPoints: ControlPoint[],
//   width: number,
//   height: number
// ) {
//   // Determine which quad the pixel is in.
//   const quadX = Math.floor(x / (width / 3));
//   const quadY = Math.floor(y / (height / 3));

//   const index = quadY * 4 + quadX;

//   const p1 = controlPoints[quadY * 4 + quadX];
//   const p2 = controlPoints[quadY * 4 + quadX + 1];
//   const p3 = controlPoints[(quadY + 1) * 4 + quadX];
//   const p4 = controlPoints[(quadY + 1) * 4 + quadX + 1];

//   // Calculate normalized coordinates within the quad.
//   const u = (x - p1[0]) / (p2[0] - p1[0]);
//   const v = (y - p1[1]) / (p3[1] - p1[1]);

//   // Bilinear interpolation for source coordinates.
//   const sourceX =
//     p1[0] * (1 - u) * (1 - v) +
//     p2[0] * u * (1 - v) +
//     p3[0] * (1 - u) * v +
//     p4[0] * u * v;
//   const sourceY =
//     p1[1] * (1 - u) * (1 - v) +
//     p2[1] * u * (1 - v) +
//     p3[1] * (1 - u) * v +
//     p4[1] * v;

//   if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
//     return [sourceX, sourceY];
//   }
//   return null; // Out of bounds
// }

// function warpImage(
//   ctx: CanvasRenderingContext2D,
//   controlPoints: ControlPoint[]
// ) {
//   const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
//   const width = imageData.width;
//   const height = imageData.height;
//   const warpedImageData = ctx.createImageData(width, height);

//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       const sourcePixel = getSourcePixel(x, y, controlPoints, width, height);
//       if (sourcePixel) {
//         const sourceIndex =
//           (Math.floor(sourcePixel[1]) * width + Math.floor(sourcePixel[0])) * 4;
//         const destIndex = (y * width + x) * 4;
//         for (let i = 0; i < 4; i++) {
//           warpedImageData.data[destIndex + i] = imageData.data[sourceIndex + i];
//         }
//       }
//     }
//   }
//   ctx.putImageData(warpedImageData, 0, 0);
// }

// /**
//  * Currently only opacity layer used of mask
//  * Use children as mask on everything that is already draw on the layer
//  * You can wrap the mask in a new layer to control the input of the mask
//  * @example
//  *  drawImage({ image: background })
//  *  layer([
//  *    fillColor({ color: red }),
//  *    mask([    // mask only on layer with fillColor
//  *      drawImage({ image: text })
//  *    ])
//  *  ])
//  */
// export const warp = (): IRenderItem => ({
//   name: "warp",
//   draw(ctx, drawPrev, _config, drawChildren) {
//     // Source grid (original positions)

//     const w = ctx.canvas.width;
//     const h = ctx.canvas.height;

//     const srcGrid: ControlPoint[] = [
//       [0, 0],
//       [w / 3, 0],
//       [(2 * w) / 3, 0],
//       [w, 0],
//       [0, h / 3],
//       [w / 3, h / 3],
//       [(2 * w) / 3, h / 3],
//       [w, h / 3],
//       [0, (2 * h) / 3],
//       [w / 3, (2 * h) / 3],
//       [(2 * w) / 3, (2 * h) / 3],
//       [w, (2 * h) / 3],
//       [0, h],
//       [w / 3, h],
//       [(2 * w) / 3, h],
//       [w, h],
//     ];

//     // Destination grid (warped positions)
//     const dstGrid: ControlPoint[] = [
//       // Modify these points to create the warp effect
//       [0, 0],
//       [w / 3, 50],
//       [(2 * w) / 3, -50],
//       [w, 0],
//       [0, h / 3],
//       [w / 3, h / 3 + 50],
//       [(2 * w) / 3, h / 3 - 50],
//       [w, h / 3],
//       [0, (2 * h) / 3],
//       [w / 3, (2 * h) / 3 + 50],
//       [(2 * w) / 3, (2 * h) / 3 - 50],
//       [w, (2 * h) / 3],
//       [0, h],
//       [w / 3, h - 50],
//       [(2 * w) / 3, h + 50],
//       [w, h],
//     ];

//     drawPrev?.(ctx);
//     if (drawChildren) ctx.save();
//     warpImage(ctx, dstGrid);
//     drawChildren?.(ctx);
//     if (drawChildren) ctx.restore();
//     return this;
//   },
// });
