import { IRenderItem } from "../canvas";

type ControlPoint = [x: number, y: number];

// mesh warp

// B-Spline Warping Class

// Key Features
// - 4x4 B-Spline Grid: Smoothly warps image using 16 control points
// - Bilinear Sampling: Produces smooth results without pixelation
// - Cubic B-Spline Basis: Ensures C² continuity (smooth curvature)
// - Edge Handling: Clamps coordinates to avoid out-of-bounds sampling

type Point = { x: number; y: number };

class BSplineWarper {
  private controlPoints: Point[][];
  private degree: number;
  private knots: number[];

  constructor(controlGrid: Point[][]) {
    this.controlPoints = controlGrid;
    this.degree = 3; // Cubic B-Spline
    this.knots = this.createUniformKnots(controlGrid.length);
  }

  // Create uniform knot vector for B-Spline
  private createUniformKnots(numControlPoints: number): number[] {
    const knots: number[] = [];
    for (let i = 0; i < numControlPoints + this.degree + 1; i++) {
      knots.push(i);
    }
    return knots;
  }

  // B-Spline basis function (Cox-de Boor algorithm)
  private basisFunction(i: number, t: number, degree = this.degree): number {
    if (degree === 0) {
      return t >= this.knots[i] && t < this.knots[i + 1] ? 1 : 0;
    }

    const left =
      this.knots[i + degree] - this.knots[i] === 0
        ? 0
        : ((t - this.knots[i]) / (this.knots[i + degree] - this.knots[i])) *
          this.basisFunction(i, t, degree - 1);

    const right =
      this.knots[i + this.degree + 1] - this.knots[i + 1] === 0
        ? 0
        : ((this.knots[i + degree + 1] - t) /
            (this.knots[i + degree + 1] - this.knots[i + 1])) *
          this.basisFunction(i + 1, t, degree - 1);

    return left + right;
  }

  // Warp image using B-Spline grid
  public warp(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new ImageData(width, height);
    const gridSize = this.controlPoints.length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Normalized coordinates
        const u = (x / width) * (gridSize - this.degree);
        const v = (y / height) * (gridSize - this.degree);

        // Calculate weighted sum of control points
        let sx = 0,
          sy = 0;
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const bu = this.basisFunction(i, u);
            const bv = this.basisFunction(j, v);
            sx += this.controlPoints[i][j].x * bu * bv;
            sy += this.controlPoints[i][j].y * bu * bv;
          }
        }

        // Sample source image (nearest neighbor)
        const srcX = Math.round(sx);
        const srcY = Math.round(sy);
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const srcIdx = (srcY * width + srcX) * 4;
          const dstIdx = (y * width + x) * 4;
          result.data.set(data.subarray(srcIdx, srcIdx + 4), dstIdx);
        }
      }
    }
    return result;
  }
}

function drawControlPoints(
  ctx: CanvasRenderingContext2D,
  grid: ControlPoint[],
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

  const rows = Math.sqrt(grid.length);
  const cols = rows;

  // Horizontal lines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const current = grid[row * cols + col];
      const next = grid[row * cols + col + 1];
      ctx.moveTo(current[0], current[1]);
      ctx.lineTo(next[0], next[1]);
    }
  }

  // Vertical lines
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 1; row++) {
      const current = grid[row * cols + col];
      const next = grid[(row + 1) * cols + col];
      ctx.moveTo(current[0], current[1]);
      ctx.lineTo(next[0], next[1]);
    }
  }

  ctx.stroke();

  grid.forEach((point: ControlPoint) => {
    ctx.beginPath();
    ctx.arc(point[0], point[1], radius, 0, Math.PI * 2); // Draw circle at control point
    ctx.fill();
    ctx.stroke();
  });

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
  name: "b-spline-wrap",
  draw(ctx, drawPrev, _config, drawChildren) {
    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    drawChildren?.(ctx);

    const canvas = ctx.canvas;

    // Initialize B-Spline warper
    // Initialize control points (4x4 grid)
    const controlGrid: Point[][] = [];
    for (let i = 0; i < 4; i++) {
      const row: Point[] = [];
      for (let j = 0; j < 4; j++) {
        row.push({
          x: (i / 3) * canvas.width,
          y: (j / 3) * canvas.height,
        });
      }
      controlGrid.push(row);
    }

    // Modify control points to create warp
    controlGrid[1][1].x += 50;
    controlGrid[1][1].y -= 30;
    controlGrid[2][2].x -= 40;
    controlGrid[2][2].y += 20;

    const originalData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    const warper = new BSplineWarper(controlGrid);
    const warpedData = warper.warp(originalData);
    ctx.putImageData(warpedData, 0, 0);

    //     drawControlPoints(ctx, warp.controlPoints);

    if (drawChildren) ctx.restore();
    return this;
  },
});
