// https://khanhha.github.io/posts/Thin-Plate-Splines-Warping/

import { IRenderItem, ItemDrawFn } from "../canvas";
import { ItemOverlayFn } from "../overlays";
import { ItemConfigFn } from "../configs";
import {
  FreeControlPointsOverlay,
  FreeControlPointsConfig,
} from "../components/FreeControlPointsOverlay";
import { addOperation, IOperation } from ".";

// ============================================================================
// Types
// ============================================================================

export interface TPSPoint {
  x: number;
  y: number;
}

export interface TPSControlPoint {
  /** Normalized x position (0-1) */
  x: number;
  /** Normalized y position (0-1) */
  y: number;
  /** Normalized x displacement (-1 to 1) */
  dx: number;
  /** Normalized y displacement (-1 to 1) */
  dy: number;
}

export interface IThinPlatesSplinesConfig extends FreeControlPointsConfig {
  /** Control points with source position (x,y) and displacement (dx,dy) */
  controlPoints?: TPSControlPoint[];
  /** Strength of the deformation (0-1) */
  strength?: number;
  /** Regularization parameter to prevent overfitting (0 = exact interpolation) */
  regularization?: number;
}

// ============================================================================
// Thin Plate Splines Implementation
// ============================================================================

/**
 * Thin Plate Splines warpper class
 * Computes TPS transformation from source to target points and applies to images
 */
class ThinPlateSplinesWarper {
  private width: number;
  private height: number;
  private sourcePoints: TPSPoint[];
  private targetPoints: TPSPoint[];
  private strength: number;
  private regularization: number;

  // Cache for computed weights
  private weights: { wx: number[]; wy: number[] } | null = null;
  private affine: {
    a0x: number;
    a1x: number;
    a2x: number;
    a0y: number;
    a1y: number;
    a2y: number;
  } | null = null;

  constructor(
    width: number,
    height: number,
    sourcePoints: TPSPoint[],
    targetPoints: TPSPoint[],
    strength: number = 1.0,
    regularization: number = 0.0,
  ) {
    this.width = width;
    this.height = height;
    this.sourcePoints = sourcePoints;
    this.targetPoints = targetPoints;
    this.strength = strength;
    this.regularization = regularization;
  }

  /**
   * Radial basis function for TPS: φ(r) = r² log(r)
   * For r = 0, φ(0) = 0
   */
  private static phi(r: number): number {
    if (r === 0) return 0;
    return r * r * Math.log(r * r);
  }

  /**
   * Compute the TPS weights by solving the linear system
   */
  private computeWeights(): void {
    const n = this.sourcePoints.length;

    if (n === 0) {
      this.weights = { wx: [], wy: [] };
      this.affine = { a0x: 0, a1x: 1, a2x: 0, a0y: 0, a1y: 0, a2y: 1 };
      return;
    }

    // Build kernel matrix K (n x n)
    const K: number[][] = [];
    for (let i = 0; i < n; i++) {
      K[i] = [];
      for (let j = 0; j < n; j++) {
        const dx = this.sourcePoints[i].x - this.sourcePoints[j].x;
        const dy = this.sourcePoints[i].y - this.sourcePoints[j].y;
        const r = Math.sqrt(dx * dx + dy * dy);
        K[i][j] = ThinPlateSplinesWarper.phi(r);
      }
    }

    // Build polynomial matrix P (n x 3)
    const P: number[][] = [];
    for (let i = 0; i < n; i++) {
      P[i] = [1, this.sourcePoints[i].x, this.sourcePoints[i].y];
    }

    // Build target vectors
    const qx: number[] = this.targetPoints.map((p) => p.x);
    const qy: number[] = this.targetPoints.map((p) => p.y);

    // Build the full system matrix (n+3) x (n+3)
    const size = n + 3;
    const systemX: number[][] = [];
    const systemY: number[][] = [];

    for (let i = 0; i < size; i++) {
      systemX[i] = new Array(size).fill(0);
      systemY[i] = new Array(size).fill(0);
    }

    // Top-left: K matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        systemX[i][j] = K[i][j];
        systemY[i][j] = K[i][j];
      }
    }

    // Top-right: P matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 3; j++) {
        systemX[i][n + j] = P[i][j];
        systemY[i][n + j] = P[i][j];
      }
    }

    // Bottom-left: P^T matrix
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < n; j++) {
        systemX[n + i][j] = P[j][i];
        systemY[n + i][j] = P[j][i];
      }
    }

    // Add regularization to K diagonal
    if (this.regularization > 0) {
      for (let i = 0; i < n; i++) {
        systemX[i][i] += this.regularization;
        systemY[i][i] += this.regularization;
      }
    }

    // Build right-hand side vectors
    const rhsX: number[] = [...qx, 0, 0, 0];
    const rhsY: number[] = [...qy, 0, 0, 0];

    // Solve the system using Gaussian elimination
    const solutionX = this.solveSystem(systemX, rhsX);
    const solutionY = this.solveSystem(systemY, rhsY);

    // Extract weights and affine coefficients
    this.weights = {
      wx: solutionX.slice(0, n),
      wy: solutionY.slice(0, n),
    };

    this.affine = {
      a0x: solutionX[n],
      a1x: solutionX[n + 1],
      a2x: solutionX[n + 2],
      a0y: solutionY[n],
      a1y: solutionY[n + 1],
      a2y: solutionY[n + 2],
    };
  }

  /**
   * Solve a linear system Ax = b using Gaussian elimination
   */
  private solveSystem(A: number[][], b: number[]): number[] {
    const n = A.length;

    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      matrix[i] = [...A[i]];
    }
    const rhs = [...b];

    // Forward elimination
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(matrix[row][col]) > Math.abs(matrix[maxRow][col])) {
          maxRow = row;
        }
      }

      [matrix[col], matrix[maxRow]] = [matrix[maxRow], matrix[col]];
      [rhs[col], rhs[maxRow]] = [rhs[maxRow], rhs[col]];

      if (Math.abs(matrix[col][col]) < 1e-10) {
        continue;
      }

      for (let row = col + 1; row < n; row++) {
        const factor = matrix[row][col] / matrix[col][col];
        for (let c = col; c < n; c++) {
          matrix[row][c] -= factor * matrix[col][c];
        }
        rhs[row] -= factor * rhs[col];
      }
    }

    // Back substitution
    const solution: number[] = new Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
      let sum = rhs[row];
      for (let col = row + 1; col < n; col++) {
        sum -= matrix[row][col] * solution[col];
      }
      if (Math.abs(matrix[row][row]) > 1e-10) {
        solution[row] = sum / matrix[row][row];
      } else {
        solution[row] = 0;
      }
    }

    return solution;
  }

  /**
   * Apply TPS transformation to a single point
   */
  private transformPoint(x: number, y: number): { tx: number; ty: number } {
    if (!this.weights || !this.affine) {
      return { tx: x, ty: y };
    }

    const n = this.sourcePoints.length;

    let sumWx = 0;
    let sumWy = 0;

    for (let i = 0; i < n; i++) {
      const dx = x - this.sourcePoints[i].x;
      const dy = y - this.sourcePoints[i].y;
      const r = Math.sqrt(dx * dx + dy * dy);
      const phiVal = ThinPlateSplinesWarper.phi(r);

      sumWx += this.weights.wx[i] * phiVal;
      sumWy += this.weights.wy[i] * phiVal;
    }

    const tx =
      this.affine.a0x + this.affine.a1x * x + this.affine.a2x * y + sumWx;
    const ty =
      this.affine.a0y + this.affine.a1y * x + this.affine.a2y * y + sumWy;

    return { tx, ty };
  }

  /**
   * Warp the image using TPS transformation
   */
  public warpImage(sourceData: ImageData): ImageData {
    this.computeWeights();

    const targetData = new ImageData(this.width, this.height);
    const srcPixels = new Uint32Array(sourceData.data.buffer);
    const dstPixels = new Uint32Array(targetData.data.buffer);

    for (let y = 0; y < this.height; y++) {
      const normY = y / (this.height - 1);

      for (let x = 0; x < this.width; x++) {
        const normX = x / (this.width - 1);

        const { tx, ty } = this.transformPoint(normX, normY);

        const srcX = x - (tx - normX) * this.width * this.strength;
        const srcY = y - (ty - normY) * this.height * this.strength;

        if (
          srcX >= 0 &&
          srcX < this.width - 1 &&
          srcY >= 0 &&
          srcY < this.height - 1
        ) {
          const xFloor = Math.floor(srcX);
          const yFloor = Math.floor(srcY);
          const xWeight = srcX - xFloor;
          const yWeight = srcY - yFloor;

          const idx00 = yFloor * this.width + xFloor;
          const idx10 = idx00 + 1;
          const idx01 = idx00 + this.width;
          const idx11 = idx01 + 1;

          const p00 = srcPixels[idx00];
          const p10 = srcPixels[idx10];
          const p01 = srcPixels[idx01];
          const p11 = srcPixels[idx11];

          let r = 0,
            g = 0,
            b = 0,
            a = 0;
          for (let shift = 0; shift <= 24; shift += 8) {
            const c00 = (p00 >> shift) & 0xff;
            const c10 = (p10 >> shift) & 0xff;
            const c01 = (p01 >> shift) & 0xff;
            const c11 = (p11 >> shift) & 0xff;

            const top = c00 + xWeight * (c10 - c00);
            const bottom = c01 + xWeight * (c11 - c01);
            const val = Math.round(top + yWeight * (bottom - top));

            if (shift === 0) r = val;
            else if (shift === 8) g = val;
            else if (shift === 16) b = val;
            else a = val;
          }

          dstPixels[y * this.width + x] = r | (g << 8) | (b << 16) | (a << 24);
        } else {
          dstPixels[y * this.width + x] = 0x00000000;
        }
      }
    }

    return targetData;
  }
}

// ============================================================================
// Factory function
// ============================================================================

export const thinPlateSplines = ({
  controlPoints = [],
  strength = 1.0,
  regularization = 0.001,
}: IThinPlatesSplinesConfig): IRenderItem<IThinPlatesSplinesConfig> => ({
  name: "thinPlateSplines",
  config: { controlPoints, strength, regularization },
});

// ============================================================================
// Draw Function
// ============================================================================

export const draw: ItemDrawFn<IThinPlatesSplinesConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
  drawPrev?.(ctx);

  const drawInput = drawArgs?.[0];
  if (drawInput) ctx.save();
  drawInput?.(ctx);

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const originalData = ctx.getImageData(0, 0, w, h);

  const {
    controlPoints = [],
    strength = 1.0,
    regularization = 0.001,
  } = config || {};

  // Convert control points to source and target points
  const srcPts: TPSPoint[] = controlPoints.map((p) => ({ x: p.x, y: p.y }));
  const tgtPts: TPSPoint[] = controlPoints.map((p) => ({
    x: p.x + p.dx,
    y: p.y + p.dy,
  }));

  const warper = new ThinPlateSplinesWarper(
    w,
    h,
    srcPts,
    tgtPts,
    strength,
    regularization,
  );

  const warpedData = warper.warpImage(originalData);
  ctx.putImageData(warpedData, 0, 0);

  if (drawInput) ctx.restore();
};

// ============================================================================
// Overlay Component
// ============================================================================

export const ThinPlatesSplinesOverlay: ItemOverlayFn<
  IThinPlatesSplinesConfig
> = (props) => {
  // Use the reusable FreeControlPointsOverlay component
  return <FreeControlPointsOverlay<IThinPlatesSplinesConfig> {...props} />;
};

// ============================================================================
// Config Component
// ============================================================================

export const ThinPlatesSplinesConfig: ItemConfigFn<
  IThinPlatesSplinesConfig
> = ({ config, mutateConfig }) => {
  const { strength = 1.0, regularization = 0.001 } = config || {};

  return (
    <div
      style={{
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Strength: {strength.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={strength}
          onChange={(e) => {
            mutateConfig((newConfig: IThinPlatesSplinesConfig) => {
              newConfig.strength = parseFloat(e.target.value);
            });
          }}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Regularization: {regularization.toFixed(4)}
        </label>
        <input
          type="range"
          min="0"
          max="0.01"
          step="0.0001"
          value={regularization}
          onChange={(e) => {
            mutateConfig((newConfig: IThinPlatesSplinesConfig) => {
              newConfig.regularization = parseFloat(e.target.value);
            });
          }}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ fontSize: "12px", color: "#666" }}>
        <p>Click and drag blue points to move source positions.</p>
        <p>Click and drag green points to move target positions.</p>
        <p>Lines show the deformation direction.</p>
      </div>
    </div>
  );
};

const operation: IOperation<"thinPlateSplines", IThinPlatesSplinesConfig> = {
  key: "thinPlateSplines",
  create: thinPlateSplines,
  draw,
  configComponent: ThinPlatesSplinesConfig,
  overlayComponent: ThinPlatesSplinesOverlay,
} as const;

addOperation(operation);
