import { getContext2d, IRenderItem, ItemDrawFn } from "../canvas";

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
  // const numKnots = numControlPoints + degree + 1;
  const knots: number[] = [];

  // Start with 'degree + 1' repetitions of 0
  for (let i = 0; i <= degree; i++) {
    knots.push(0);
  }

  // Uniformly spaced knots in the middle
  for (let i = 1; i < numControlPoints - degree; i++) {
    knots.push(i);
  }

  // End with 'degree + 1' repetitions of the last knot value
  const lastKnotValue = numControlPoints - degree;
  for (let i = 0; i <= degree; i++) {
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

// Evaluate B-spline curve at parameter u
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

function warpImage(
  sourceImageData: ImageData,
  destinationImageData: ImageData,
  controlPoints: Point[][]
): void {
  const width = sourceImageData.width;
  const height = sourceImageData.height;
  const destWidth = destinationImageData.width;
  const destHeight = destinationImageData.height;
  const degree = 3; // Cubic B-spline

  if (destWidth !== width || destHeight !== height) {
    throw new Error("source and destination dimensions must be the same!");
  }

  const numControlPointsU = controlPoints.length;
  const numControlPointsV = controlPoints[0].length;

  const knotsU = calculateKnotVector(degree, numControlPointsU);
  const knotsV = calculateKnotVector(degree, numControlPointsV);
  // console.log("Knots U:", knotsU); // Debugging
  // console.log("Knots V:", knotsV);

  for (let y = 0; y < destHeight; y++) {
    for (let x = 0; x < destWidth; x++) {
      const u = (x / (destWidth - 1)) * (numControlPointsU - degree); // Normalize and scale to knot range
      const v = (y / (destHeight - 1)) * (numControlPointsV - degree);

      const mappedPoint = bSpline(u, v, degree, controlPoints, knotsU, knotsV);

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

export const drawBSpline: ItemDrawFn<undefined> = (
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

  // 16 control points (4x4 grid)
  const controlPoints: Point[][] = [];
  for (let i = 0; i < 4; i++) {
    controlPoints[i] = [];
    for (let j = 0; j < 4; j++) {
      // Initial control points (no deformation)
      controlPoints[i][j] = {
        x: (i / 3) * width,
        y: (j / 3) * height,
      };
    }
  }

  // Example deformation: move some control points
  const strength = 3;
  controlPoints[1][1].x += 50 * strength;
  controlPoints[1][1].y += 20 * strength;
  controlPoints[2][2].x -= 30 * strength;
  controlPoints[2][2].y -= 40 * strength;
  controlPoints[1][2].x -= 50 * strength;
  controlPoints[1][2].y += 40 * strength;

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

  warpImage(originalData, destinationImageData, controlPoints);

  ctx.putImageData(destinationImageData, 0, 0);

  drawControlPoints(ctx, controlPoints);

  if (drawChildren) ctx.restore();
};
