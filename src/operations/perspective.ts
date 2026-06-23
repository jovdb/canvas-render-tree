import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

export interface IPerspectiveConfig {
  /** Normalized control points */
  controlPoints: [
    topLeft: Point,
    topRight: Point,
    bottomRight: Point,
    bottomLeft: Point,
  ];
}

export const perspective = (
  config: IPerspectiveConfig,
  /** When passed, only the children will have opacity */
  input?: RenderTree | undefined,
): IRenderItem<IPerspectiveConfig> => ({
  name: "perspective",
  config,
  input,
});
interface Point {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Function to perform perspective transformation
function perspectiveTransform(
  sourceImageData: ImageData,
  destinationImageData: ImageData,
  srcPoints: Point[], // Four corners of the source quad
  destPoints: Point[], // Four corners of the destination quad
): void {
  const width = sourceImageData.width;
  const height = sourceImageData.height;
  const destWidth = destinationImageData.width;
  const destHeight = destinationImageData.height;

  if (destWidth !== width || destHeight !== height) {
    //For simplicity dest and src have the same size
    throw new Error(
      "Source and destination image data must have the same dimensions.",
    );
  }
  if (srcPoints.length !== 4 || destPoints.length !== 4) {
    throw new Error(
      "Both source and destination points must have exactly 4 points (corners).",
    );
  }

  // Compute the perspective transformation matrix (homography)
  const transformMatrix = getPerspectiveTransform(srcPoints, destPoints);

  // Inverse transform for mapping destination pixels to source pixels
  const inverseTransformMatrix = invertMatrix(transformMatrix);
  // Todo cubic interpolation for subpixel edges

  // --- Helper function to check if a point is inside the quad ---
  function isPointInQuad(x: number, y: number, quad: Point[]): boolean {
    // Based on checking the cross product of vectors formed by the point and quad edges
    let windingNumber = 0;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const crossProduct =
        (quad[j].x - quad[i].x) * (y - quad[i].y) -
        (quad[j].y - quad[i].y) * (x - quad[i].x);

      if (quad[i].y <= y) {
        if (quad[j].y > y && crossProduct > 0) {
          windingNumber++;
        }
      } else {
        if (quad[j].y <= y && crossProduct < 0) {
          windingNumber--;
        }
      }
    }
    return windingNumber !== 0;
  }

  for (let y = 0; y < destHeight; y++) {
    for (let x = 0; x < destWidth; x++) {
      const destIndex = (y * destWidth + x) * 4;

      // Check if the destination pixel is inside the destination quad
      if (!isPointInQuad(x, y, destPoints)) {
        // Make the pixel transparent
        destinationImageData.data[destIndex + 3] = 0; // Set alpha to 0
        continue; // Skip to the next pixel
      }

      // Map the destination pixel (x, y) back to the source image
      const srcCoords = applyTransform(x, y, inverseTransformMatrix);

      // Bi-linear interpolation
      const srcX = Math.floor(srcCoords.x);
      const srcY = Math.floor(srcCoords.y);

      const x0 = clamp(srcX, 0, width - 1);
      const y0 = clamp(srcY, 0, height - 1);
      const x1 = clamp(srcX + 1, 0, width - 1);
      const y1 = clamp(srcY + 1, 0, height - 1);

      const dx = srcCoords.x - srcX;
      const dy = srcCoords.y - srcY;

      const index00 = (y0 * width + x0) * 4;
      const index01 = (y0 * width + x1) * 4;
      const index10 = (y1 * width + x0) * 4;
      const index11 = (y1 * width + x1) * 4;

      for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
        // Interpolate
        destinationImageData.data[destIndex + colorIndex] =
          (1 - dx) * (1 - dy) * sourceImageData.data[index00 + colorIndex] +
          dx * (1 - dy) * sourceImageData.data[index01 + colorIndex] +
          (1 - dx) * dy * sourceImageData.data[index10 + colorIndex] +
          dx * dy * sourceImageData.data[index11 + colorIndex];
      }
    }
  }
}

// --- Helper Functions for Matrix Operations ---

// Get the perspective transformation matrix (3x3 homography matrix)
function getPerspectiveTransform(
  srcPoints: Point[],
  destPoints: Point[],
): number[] {
  // Based on the OpenCV implementation and Direct Linear Transform (DLT)
  const a = [];
  for (let i = 0; i < 4; i++) {
    a.push([
      srcPoints[i].x,
      srcPoints[i].y,
      1,
      0,
      0,
      0,
      -destPoints[i].x * srcPoints[i].x,
      -destPoints[i].x * srcPoints[i].y,
    ]);
    a.push([
      0,
      0,
      0,
      srcPoints[i].x,
      srcPoints[i].y,
      1,
      -destPoints[i].y * srcPoints[i].x,
      -destPoints[i].y * srcPoints[i].y,
    ]);
  }

  const b = [
    destPoints[0].x,
    destPoints[0].y,
    destPoints[1].x,
    destPoints[1].y,
    destPoints[2].x,
    destPoints[2].y,
    destPoints[3].x,
    destPoints[3].y,
  ];

  // Solve the system of linear equations a * h = b
  const h = solveLinearSystem(a, b);

  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

// Solve a system of linear equations using Gaussian elimination
function solveLinearSystem(a: number[][], b: number[]): number[] {
  const n = b.length;

  // Augment the matrix a with b
  for (let i = 0; i < n; i++) {
    a[i].push(b[i]);
  }

  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    // Find pivot (largest absolute value) in current column
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [a[i], a[maxRow]] = [a[maxRow], a[i]];

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const c = -a[k][i] / a[i][i];
      for (let j = i; j < n + 1; j++) {
        if (i === j) {
          a[k][j] = 0;
        } else {
          a[k][j] += c * a[i][j];
        }
      }
    }
  }

  // Solve equation Ax=b for an upper triangular matrix A
  const x = new Array(n).fill(0);
  for (let i = n - 1; i > -1; i--) {
    x[i] = a[i][n] / a[i][i];
    for (let k = i - 1; k > -1; k--) {
      a[k][n] -= a[k][i] * x[i];
    }
  }
  return x;
}
// Invert a 3x3 matrix
function invertMatrix(matrix: number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = matrix;

  const det = a * (e * i - h * f) - b * (d * i - g * f) + c * (d * h - g * e);
  if (det === 0) {
    throw new Error("Matrix is not invertible (determinant is zero).");
  }

  const invDet = 1 / det;
  return [
    (e * i - f * h) * invDet,
    (c * h - b * i) * invDet,
    (b * f - c * e) * invDet,
    (f * g - d * i) * invDet,
    (a * i - c * g) * invDet,
    (c * d - a * f) * invDet,
    (d * h - e * g) * invDet,
    (b * g - a * h) * invDet,
    (a * e - b * d) * invDet,
  ];
}

// Apply the perspective transformation to a point
function applyTransform(x: number, y: number, matrix: number[]): Point {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const w = g * x + h * y + i; // Homogeneous coordinate
  return {
    x: (a * x + b * y + c) / w,
    y: (d * x + e * y + f) / w,
  };
}

export const draw: ItemDrawFn<IPerspectiveConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  drawPrev?.(ctx);
  if (drawInput) ctx.save();

  const { width, height } = ctx.canvas;
  const destinationImageData = new ImageData(width, height);
  const sourceImageData = ctx.getImageData(0, 0, width, height);

  // Define the four corners of the source image (a rectangle)
  const srcPoints: Point[] = [
    { x: 0, y: 0 }, // Top-left
    { x: width, y: 0 }, // Top-right
    { x: width, y: height }, // Bottom-right
    { x: 0, y: height }, // Bottom-left
  ];

  // Define the four corners of the *desired* perspective-transformed quadrilateral
  const normalizedControlPoints = config.controlPoints;
  const destPoints: Point[] = [
    {
      x: width * normalizedControlPoints[0].x,
      y: height * normalizedControlPoints[0].y,
    }, // Top-left (scaled)
    {
      x: width * normalizedControlPoints[1].x,
      y: height * normalizedControlPoints[1].y,
    }, // Top-right (scaled)
    {
      x: width * normalizedControlPoints[2].x,
      y: height * normalizedControlPoints[2].y,
    }, // Bottom-right (scaled)
    {
      x: width * normalizedControlPoints[3].x,
      y: height * normalizedControlPoints[3].y,
    }, // Bottom
  ];

  perspectiveTransform(
    sourceImageData,
    destinationImageData,
    srcPoints,
    destPoints,
  );

  ctx.putImageData(destinationImageData, 0, 0);

  drawInput?.(ctx);
  if (drawInput) ctx.restore();
};

addRenderer("perspective", {
  draw,
});
