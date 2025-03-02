import { getContext2d, IRenderItem, ItemDrawFn } from "../canvas";
import { addRenderer } from "../renderers";

interface Point {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Calculate knot vector for B-spline (uniform, open)
function calculateKnotVector(
  degree: number,
  numControlPoints: number
): number[] {
  const numKnots = numControlPoints + degree + 1;
  const knots: number[] = [];

  // Start with 'degree + 1' repetitions of 0
  for (let i = 0; i < degree + 1; i++) {
    knots.push(0);
  }

  // Uniformly spaced knots in the middle
  for (let i = 1; i < numControlPoints - degree; i++) {
    knots.push(i);
  }

  // End with 'degree + 1' repetitions of the last knot value
  const lastKnotValue = numControlPoints - degree;
  for (let i = 0; i < degree + 1; i++) {
    knots.push(lastKnotValue);
  }

  return knots;
}

// B-spline basis function (Cox-de Boor recursion formula)
function bSplineBasis(
  i: number,
  degree: number,
  u: number,
  knots: number[]
): number {
  if (degree === 0) {
    return knots[i] <= u && u < knots[i + 1] ? 1 : 0;
  }

  const term1Numerator = u - knots[i];
  const term1Denominator = knots[i + degree] - knots[i];
  const term1 =
    term1Denominator !== 0
      ? (term1Numerator / term1Denominator) *
        bSplineBasis(i, degree - 1, u, knots)
      : 0;

  const term2Numerator = knots[i + degree + 1] - u;
  const term2Denominator = knots[i + degree + 1] - knots[i + 1];
  const term2 =
    term2Denominator !== 0
      ? (term2Numerator / term2Denominator) *
        bSplineBasis(i + 1, degree - 1, u, knots)
      : 0;

  return term1 + term2;
}

// Evaluate B-spline surface at parameter u, v
function bSpline(
  u: number,
  v: number,
  degree: number,
  controlPoints: Point[][],
  knotsU: number[],
  knotsV: number[]
): Point {
  let x = 0;
  let y = 0;

  const numControlPointsU = controlPoints.length;
  const numControlPointsV = controlPoints[0].length;

  for (let i = 0; i < numControlPointsU; i++) {
    for (let j = 0; j < numControlPointsV; j++) {
      const basisU = bSplineBasis(i, degree, u, knotsU);
      const basisV = bSplineBasis(j, degree, v, knotsV);

      x += controlPoints[i][j].x * basisU * basisV;
      y += controlPoints[i][j].y * basisU * basisV;
    }
  }
  return { x, y };
}

// Inverse distance weighted interpolation (Shepard's method) for smoother warping
function inverseDistanceWeighted(
  targetX: number,
  targetY: number,
  controlPoints: Point[][],
  sourcePoints: Point[][],
  power: number = 2
): Point {
  let weightedSumX = 0;
  let weightedSumY = 0;
  let totalWeight = 0;

  const numControlPointsU = controlPoints.length;
  const numControlPointsV = controlPoints[0].length;

  for (let i = 0; i < numControlPointsU; i++) {
    for (let j = 0; j < numControlPointsV; j++) {
      const dx = targetX - controlPoints[i][j].x;
      const dy = targetY - controlPoints[i][j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Avoid division by zero
      if (distance < 0.0001) {
        return { x: sourcePoints[i][j].x, y: sourcePoints[i][j].y };
      }

      const weight = 1 / Math.pow(distance, power);
      weightedSumX += sourcePoints[i][j].x * weight;
      weightedSumY += sourcePoints[i][j].y * weight;
      totalWeight += weight;
    }
  }

  return { x: weightedSumX / totalWeight, y: weightedSumY / totalWeight };
}

function warpImage(
  sourceImageData: ImageData,
  destinationImageData: ImageData,
  originalControlPoints: Point[][], // Initial, undeformed control point grid
  deformedControlPoints: Point[][] // Deformed control point grid
): void {
  const width = sourceImageData.width;
  const height = sourceImageData.height;
  const destWidth = destinationImageData.width;
  const destHeight = destinationImageData.height;
  const degree = 3; // Cubic B-spline (you can adjust this)

  if (destWidth !== width || destHeight !== height) {
    throw new Error("Source and destination dimensions must be the same!");
  }
  if (
    originalControlPoints.length !== deformedControlPoints.length ||
    originalControlPoints[0].length !== deformedControlPoints[0].length
  ) {
    throw new Error(
      "Original and deformed control points grids must have the same dimensions"
    );
  }

  const numControlPointsU = originalControlPoints.length;
  const numControlPointsV = originalControlPoints[0].length;

  //Option 1: B-Spline interpolation
  const knotsU = calculateKnotVector(degree, numControlPointsU);
  const knotsV = calculateKnotVector(degree, numControlPointsV);

  //Option 2: inverse distance
  const useInverseDistance = false;

  for (let y = 0; y < destHeight; y++) {
    for (let x = 0; x < destWidth; x++) {
      let mappedPoint: Point;

      if (useInverseDistance) {
        mappedPoint = inverseDistanceWeighted(
          x,
          y,
          deformedControlPoints,
          originalControlPoints
        );
      } else {
        // Normalize (x, y) to (u, v) in the range [0, 1] and then scale to knot range.
        const u = (x / (destWidth - 1)) * (numControlPointsU - degree);
        const v = (y / (destHeight - 1)) * (numControlPointsV - degree);
        mappedPoint = bSpline(
          u,
          v,
          degree,
          deformedControlPoints,
          knotsU,
          knotsV
        );
      }

      // Bi-linear interpolation for smoother results
      const srcX = Math.floor(mappedPoint.x);
      const srcY = Math.floor(mappedPoint.y);

      const x0 = clamp(srcX, 0, width - 1);
      const y0 = clamp(srcY, 0, height - 1);
      const x1 = clamp(srcX + 1, 0, width - 1);
      const y1 = clamp(srcY + 1, 0, height - 1);

      const dx = mappedPoint.x - srcX;
      const dy = mappedPoint.y - srcY;

      const index00 = (y0 * width + x0) * 4;
      const index01 = (y0 * width + x1) * 4;
      const index10 = (y1 * width + x0) * 4;
      const index11 = (y1 * width + x1) * 4;

      const destIndex = (y * destWidth + x) * 4;

      // Interpolate Red
      const p00r = sourceImageData.data[index00];
      const p01r = sourceImageData.data[index01];
      const p10r = sourceImageData.data[index10];
      const p11r = sourceImageData.data[index11];
      destinationImageData.data[destIndex] =
        (1 - dx) * (1 - dy) * p00r +
        dx * (1 - dy) * p01r +
        (1 - dx) * dy * p10r +
        dx * dy * p11r;

      // Interpolate Green
      const p00g = sourceImageData.data[index00 + 1];
      const p01g = sourceImageData.data[index01 + 1];
      const p10g = sourceImageData.data[index10 + 1];
      const p11g = sourceImageData.data[index11 + 1];
      destinationImageData.data[destIndex + 1] =
        (1 - dx) * (1 - dy) * p00g +
        dx * (1 - dy) * p01g +
        (1 - dx) * dy * p10g +
        dx * dy * p11g;

      // Interpolate Blue
      const p00b = sourceImageData.data[index00 + 2];
      const p01b = sourceImageData.data[index01 + 2];
      const p10b = sourceImageData.data[index10 + 2];
      const p11b = sourceImageData.data[index11 + 2];
      destinationImageData.data[destIndex + 2] =
        (1 - dx) * (1 - dy) * p00b +
        dx * (1 - dy) * p01b +
        (1 - dx) * dy * p10b +
        dx * dy * p11b;

      destinationImageData.data[destIndex + 3] = 255; // Alpha
    }
  }
}

function drawControlPoints(
  ctx: CanvasRenderingContext2D,
  grid: Point[][],
  radius = 5,
  fillColor = "red",
  strokeColor = "red"
) {
  ctx.save(); // Save current canvas state
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;

  // Draw grid lines
  ctx.strokeStyle = "#0004";
  ctx.beginPath();

  const rows = grid.length;
  const cols = grid[0].length;

  // Horizontal lines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const current = grid[row][col];
      const next = grid[row][col + 1];
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(next.x, next.y);
    }
  }

  // Vertical lines
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 1; row++) {
      const current = grid[row][col];
      const next = grid[row + 1][col];
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(next.x, next.y);
    }
  }

  ctx.stroke();

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 1; row++) {
      const point = grid[row][col];
      console.log(point);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); // Draw circle at control point
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore(); // Restore original canvas state
}

/**
 * Currently only opacity layer used of mask
 * Use children as mask on everything that is already draw on the layer
 * You can wrap the mask in a new layer to control the input of the mask
 * @example
 *  drawImage({ image: background })
 *  layer([
 *    fillColor({ color: red }),
 *    mask([    // mask only on layer with fillColor
 *      drawImage({ image: text })
 *    ])
 *  ])
 */
export const bSplineWrap = (): IRenderItem => ({
  name: "bSplineWrap",
});

export const draw: ItemDrawFn<undefined> = (
  ctx,
  drawPrev,
  _config,
  drawChildren
) => {
  drawPrev?.(ctx);
  if (drawChildren) ctx.save();
  drawChildren?.(ctx);

  const canvas = ctx.canvas;
  const { width, height } = canvas;

  const originalData = ctx.getImageData(
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height
  );

  // Create an offscreen canvas
  const destinationCanvas = document.createElement("canvas");
  destinationCanvas.width = ctx.canvas.width;
  destinationCanvas.height = ctx.canvas.height;
  const destinationContext = getContext2d(destinationCanvas, "displacementCtx");
  const destinationImageData = destinationContext.getImageData(
    0,
    0,
    destinationCanvas.width,
    destinationCanvas.height
  );

  const numControlPointsU = 4; // 4x4 grid of control points
  const numControlPointsV = 4;
  const originalControlPoints: Point[][] = [];
  for (let i = 0; i < numControlPointsU; i++) {
    originalControlPoints[i] = [];
    for (let j = 0; j < numControlPointsV; j++) {
      originalControlPoints[i][j] = {
        x: (i / (numControlPointsU - 1)) * width, // Evenly spaced
        y: (j / (numControlPointsV - 1)) * height,
      };
    }
  }

  // Create a *copy* of the original grid, and then deform *that*
  const deformedControlPoints: Point[][] = originalControlPoints.map((row) =>
    row.map((p) => ({ ...p }))
  );

  // Example deformation: Move some control points.
  deformedControlPoints[1][1].x += 400;
  deformedControlPoints[1][1].y += 100;
  deformedControlPoints[2][2].x -= 200;
  deformedControlPoints[2][2].y -= 300;
  deformedControlPoints[1][2].x -= 400;
  deformedControlPoints[1][2].y += 300;

  warpImage(originalData, destinationImageData, originalControlPoints, deformedControlPoints);

  ctx.putImageData(destinationImageData, 0, 0);

  drawControlPoints(ctx, originalControlPoints);

  if (drawChildren) ctx.restore();
};

addRenderer("bSplineWrap", {
  draw,
});
