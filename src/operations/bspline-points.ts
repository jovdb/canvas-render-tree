import { IRenderItem, ItemDrawFn } from "../canvas";
import { addRenderer } from "../renderers";
type Point = { x: number; y: number };
type Vector = { dx: number; dy: number };

const math = {
  transpose: <T>(matrix: T[][]): T[][] => {
    if (matrix.length === 0) return [];
    return matrix[0].map((_, i) => matrix.map((row) => row[i]));
  },

  multiply: (
    a: number[][] | number[],
    b: number[][] | number[],
  ): number[] | number[][] => {
    // Handle matrix-vector multiplication
    if (Array.isArray(a[0]) && !Array.isArray(b[0])) {
      const matrix = a as number[][];
      const vector = b as number[];
      return matrix.map((row) =>
        row.reduce((sum, val, i) => sum + val * (vector[i] || 0), 0),
      );
    }

    // Handle matrix-matrix multiplication
    if (Array.isArray(a[0]) && Array.isArray(b[0])) {
      const aMat = a as number[][];
      const bMat = math.transpose(b as number[][]);
      return aMat.map((row) =>
        bMat.map((col) =>
          row.reduce((sum, val, i) => sum + val * (col[i] || 0), 0),
        ),
      );
    }

    throw new Error("Unsupported multiplication type");
  },

  lusolve: (A: number[][], b: number[]): number[] => {
    const n = A.length;
    const LU = A.map((row) => [...row]);
    const piv = Array.from({ length: n }, (_, i) => i);

    // LU decomposition with partial pivoting
    for (let k = 0; k < n; k++) {
      // Find pivot
      let maxRow = k;
      for (let i = k; i < n; i++) {
        if (Math.abs(LU[i][k]) > Math.abs(LU[maxRow][k])) {
          maxRow = i;
        }
      }

      // Swap rows
      [LU[k], LU[maxRow]] = [LU[maxRow], LU[k]];
      [piv[k], piv[maxRow]] = [piv[maxRow], piv[k]];

      // Singular matrix check
      if (Math.abs(LU[k][k]) < 1e-10) {
        throw new Error("Matrix is singular");
      }

      // Compute multipliers
      for (let i = k + 1; i < n; i++) {
        LU[i][k] /= LU[k][k];
        for (let j = k + 1; j < n; j++) {
          LU[i][j] -= LU[i][k] * LU[k][j];
        }
      }
    }

    // Solve Ly = Pb (forward substitution)
    const y = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      y[i] = b[piv[i]];
      for (let j = 0; j < i; j++) {
        y[i] -= LU[i][j] * y[j];
      }
    }

    // Solve Ux = y (backward substitution)
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = y[i];
      for (let j = i + 1; j < n; j++) {
        x[i] -= LU[i][j] * x[j];
      }
      x[i] /= LU[i][i];
    }

    return x;
  },
};

export interface IBSplinePointsConfig {
  strength?: number;
}

class BSplinePointsWarper {
  private ctrlPoints: Vector[][];
  private gridWidth: number;
  private gridHeight: number;
  private cellSizeX: number;
  private cellSizeY: number;

  constructor(
    imageWidth: number,
    imageHeight: number,
    gridDensity: number = 10,
  ) {
    this.gridWidth = Math.ceil(imageWidth / gridDensity) + 3;
    this.gridHeight = Math.ceil(imageHeight / gridDensity) + 3;
    this.cellSizeX = imageWidth / (this.gridWidth - 3);
    this.cellSizeY = imageHeight / (this.gridHeight - 3);
    this.ctrlPoints = this.createControlGrid();
  }

  private createControlGrid(): Vector[][] {
    return Array.from({ length: this.gridHeight }, () =>
      Array.from({ length: this.gridWidth }, () => ({ dx: 0, dy: 0 })),
    );
  }

  private cubicBSpline(t: number): number {
    t = Math.abs(t);
    if (t < 1) return 2 / 3 + (0.5 * t - 1) * t ** 2;
    if (t < 2) return (2 - t) ** 3 / 6;
    return 0;
  }

  private getWeights(
    x: number,
    y: number,
  ): { indices: [number, number][]; weights: number[] } {
    const gridX = Math.floor(x / this.cellSizeX);
    const gridY = Math.floor(y / this.cellSizeY);
    const tx = x / this.cellSizeX - gridX;
    const ty = y / this.cellSizeY - gridY;

    const weightsX = [-1, 0, 1, 2].map((i) => this.cubicBSpline(tx - i));
    const weightsY = [-1, 0, 1, 2].map((i) => this.cubicBSpline(ty - i));

    const indices: [number, number][] = [];
    const weights: number[] = [];

    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        const ix = gridX + i - 1;
        const iy = gridY + j - 1;
        if (ix >= 0 && ix < this.gridWidth && iy >= 0 && iy < this.gridHeight) {
          indices.push([iy, ix]);
          weights.push(weightsX[i] * weightsY[j]);
        }
      }
    }
    return { indices, weights };
  }

  public solveCorrespondences(
    pointsA: Point[],
    pointsB: Point[],
    lambda: number = 0.1,
  ) {
    // Build linear system
    const A: number[][] = [];
    const bx: number[] = [];
    const by: number[] = [];

    pointsA.forEach((p, idx) => {
      const { indices, weights } = this.getWeights(p.x, p.y);
      const target = pointsB[idx];
      const row = new Array(this.gridWidth * this.gridHeight).fill(0);

      indices.forEach(([i, j], idx) => {
        row[i * this.gridWidth + j] = weights[idx];
      });

      A.push(row);
      bx.push(target.x - p.x);
      by.push(target.y - p.y);
    });

    // Add regularization
    const numVars = this.gridWidth * this.gridHeight;
    for (let i = 0; i < numVars; i++) {
      const regRow = new Array(numVars).fill(0);
      regRow[i] = Math.sqrt(lambda);
      A.push(regRow);
      bx.push(0);
      by.push(0);
    }

    // Solve least squares (pseudo-inverse)
    const xDisplacements = this.leastSquares(A, bx);
    const yDisplacements = this.leastSquares(A, by);

    // Update control points
    for (let i = 0; i < this.gridHeight; i++) {
      for (let j = 0; j < this.gridWidth; j++) {
        this.ctrlPoints[i][j].dx = xDisplacements[i * this.gridWidth + j];
        this.ctrlPoints[i][j].dy = yDisplacements[i * this.gridWidth + j];
      }
    }
  }

  private leastSquares(A: number[][], b: number[]): number[] {
    // Simple QR decomposition solver for demonstration
    // In practice, use a proper numeric library for better performance
    const At = math.transpose(A);
    const AtA = math.multiply(At, A);
    const Atb = math.multiply(At, b);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return math.lusolve(AtA as any, Atb as any) as number[];
  }

  public warpImage(source: ImageData): ImageData {
    const result = new ImageData(source.width, source.height);

    for (let y = 0; y < source.height; y++) {
      for (let x = 0; x < source.width; x++) {
        const displacement = this.getDisplacement(x, y);
        const srcX = x + displacement.dx;
        const srcY = y + displacement.dy;

        // Bicubic interpolation
        const pixel = this.bicubicInterpolate(source, srcX, srcY);
        const idx = (y * source.width + x) * 4;
        result.data.set(pixel, idx);
      }
    }
    return result;
  }

  private getDisplacement(x: number, y: number): Vector {
    const { indices, weights } = this.getWeights(x, y);
    let dx = 0;
    let dy = 0;

    indices.forEach(([i, j], idx) => {
      dx += this.ctrlPoints[i][j].dx * weights[idx];
      dy += this.ctrlPoints[i][j].dy * weights[idx];
    });

    return { dx, dy };
  }

  private bicubicInterpolate(
    image: ImageData,
    srcX: number,
    srcY: number,
  ): Uint8ClampedArray {
    const x0 = Math.floor(srcX);
    const y0 = Math.floor(srcY);
    const dx = srcX - x0;
    const dy = srcY - y0;

    let r = 0,
      g = 0,
      b = 0,
      a = 0;

    // Iterate over 4x4 grid around the sample point
    for (let j = -1; j <= 2; j++) {
      const y = y0 + j;
      const wy = this.cubicWeight(dy - j);

      for (let i = -1; i <= 2; i++) {
        const x = x0 + i;
        const wx = this.cubicWeight(dx - i);
        const weight = wx * wy;

        if (weight === 0) continue;

        // Clamp coordinates to image boundaries
        const clampedX = Math.max(0, Math.min(image.width - 1, x));
        const clampedY = Math.max(0, Math.min(image.height - 1, y));

        // Get pixel data
        const idx = (clampedY * image.width + clampedX) * 4;
        const [pr, pg, pb, pa] = image.data.slice(idx, idx + 4);

        // Accumulate weighted values
        r += pr * weight;
        g += pg * weight;
        b += pb * weight;
        a += pa * weight;
      }
    }

    // Clamp to valid byte range
    return new Uint8ClampedArray([
      Math.max(0, Math.min(255, Math.round(r))),
      Math.max(0, Math.min(255, Math.round(g))),
      Math.max(0, Math.min(255, Math.round(b))),
      Math.max(0, Math.min(255, Math.round(a))),
    ]);
  }

  private cubicWeight(t: number): number {
    const a = -0.5; // Catmull-Rom parameter
    const absT = Math.abs(t);

    if (absT < 1) {
      return (a + 2) * Math.pow(absT, 3) - (a + 3) * Math.pow(absT, 2) + 1;
    }
    if (absT < 2) {
      return (
        a * Math.pow(absT, 3) - 5 * a * Math.pow(absT, 2) + 8 * a * absT - 4 * a
      );
    }
    return 0;
  }
}

function drawControlPoint(
  ctx: CanvasRenderingContext2D,
  point1: Point,
  point2: Point,
  radius = 5,
) {
  ctx.save(); // Save current canvas state

  // Draw grid lines
  ctx.strokeStyle = "#0004";
  ctx.beginPath();
  ctx.moveTo(point1.x, point1.y);
  ctx.lineTo(point2.x, point2.y);
  ctx.stroke();

  ctx.fillStyle = "red";
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.arc(point1.x, point1.y, radius, 0, Math.PI * 2); // Draw circle at control point
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "green";
  ctx.strokeStyle = "green";
  ctx.beginPath();
  ctx.arc(point2.x, point2.y, radius, 0, Math.PI * 2); // Draw circle at control point
  ctx.fill();
  ctx.stroke();
  ctx.stroke();

  ctx.restore(); // Restore original canvas state
}

export const bSplinePoints = (
  config: IBSplinePointsConfig = {},
): IRenderItem => ({
  name: "bSplinePoints",
  config,
});

export const draw: ItemDrawFn<IBSplinePointsConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  drawPrev?.(ctx);
  if (drawInput) ctx.save();
  drawInput?.(ctx);

  const originalData = ctx.getImageData(
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height,
  );

  const warper = new BSplinePointsWarper(
    ctx.canvas.width,
    ctx.canvas.height,
    20,
  );

  // Define correspondences
  const pointsA: Point[] = [
    { x: 120, y: 100 },
    { x: 480, y: 320 },
  ]; // Source points

  const pointsB: Point[] = [
    { x: 120, y: 300 },
    { x: 450, y: 340 },
  ]; // Source points

  const { strength: lambda = 1 } = config || {};

  // Solve deformation
  warper.solveCorrespondences(pointsA, pointsB, lambda);

  const warpedData = warper.warpImage(originalData);

  ctx.putImageData(warpedData, 0, 0);

  // Draw control points
  pointsA.forEach((_, index) => {
    drawControlPoint(ctx, pointsB[index], pointsA[index]);
  });

  if (drawInput) ctx.restore();
};

addRenderer("bSplinePoints", {
  draw,
});
