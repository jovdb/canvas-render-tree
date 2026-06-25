import { IRenderItem, ItemDrawFn } from "../canvas";
import { addRendererOverlay, ItemOverlayFn } from "../overlays";
import { addRenderer } from "../renderers";
import React from "react";
import { ControlPoint } from "../components/ControlPoint";

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

export interface IThinPlatesSplinesConfig {
  /** Source control points (normalized coordinates 0-1) */
  sourcePoints?: TPSPoint[];
  /** Target control points (normalized coordinates 0-1) - where source points should move */
  targetPoints?: TPSPoint[];
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
   * The system is:
   * [ K   P ] [ w ]   [ qx ]
   * [ P^T 0 ] [ a ] = [ qy ]
   *
   * Where K is the kernel matrix, P is the polynomial terms, and q is the target points
   */
  private computeWeights(): void {
    const n = this.sourcePoints.length;

    // If no points or only one point, use identity transformation
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

    // Build target vectors qx and qy (n x 1)
    const qx: number[] = this.targetPoints.map((p) => p.x);
    const qy: number[] = this.targetPoints.map((p) => p.y);

    // Build the full system matrix (n+3) x (n+3)
    const size = n + 3;
    const systemX: number[][] = [];
    const systemY: number[][] = [];

    for (let i = 0; i < size; i++) {
      systemX[i] = [];
      systemY[i] = [];
      for (let j = 0; j < size; j++) {
        systemX[i][j] = 0;
        systemY[i][j] = 0;
      }
    }

    // Fill the system matrix
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

    // Bottom-right: zeros (3 x 3)
    // Already initialized to 0

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

    // Make copies
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      matrix[i] = [...A[i]];
    }
    const rhs = [...b];

    // Forward elimination
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(matrix[row][col]) > Math.abs(matrix[maxRow][col])) {
          maxRow = row;
        }
      }

      // Swap rows
      [matrix[col], matrix[maxRow]] = [matrix[maxRow], matrix[col]];
      [rhs[col], rhs[maxRow]] = [rhs[maxRow], rhs[col]];

      // If pivot is zero, matrix is singular
      if (Math.abs(matrix[col][col]) < 1e-10) {
        continue;
      }

      // Eliminate below
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
    // If no weights computed yet, return identity
    if (!this.weights || !this.affine) {
      return { tx: x, ty: y };
    }

    const n = this.sourcePoints.length;

    // Compute weighted sum of radial basis functions
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

    // Add affine part
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
    // Recompute weights if points changed
    this.computeWeights();

    const targetData = new ImageData(this.width, this.height);
    const srcPixels = new Uint32Array(sourceData.data.buffer);
    const dstPixels = new Uint32Array(targetData.data.buffer);

    // Precompute inverse mapping for better performance
    // For each target pixel, find its source location
    for (let y = 0; y < this.height; y++) {
      const normY = y / (this.height - 1);

      for (let x = 0; x < this.width; x++) {
        const normX = x / (this.width - 1);

        // Transform the normalized point
        const { tx, ty } = this.transformPoint(normX, normY);

        // Apply strength
        const srcX = x - (tx - normX) * this.width * this.strength;
        const srcY = y - (ty - normY) * this.height * this.strength;

        // Bilinear interpolation
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
          // Out of bounds - transparent
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
  sourcePoints = [],
  targetPoints = [],
  strength = 1.0,
  regularization = 0.001,
}: IThinPlatesSplinesConfig): IRenderItem<IThinPlatesSplinesConfig> => ({
  name: "thinPlateSplines",
  config: { sourcePoints, targetPoints, strength, regularization },
});

// ============================================================================
// Draw Function
// ============================================================================

export const draw: ItemDrawFn<IThinPlatesSplinesConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  // First draw background / previous stack items
  drawPrev?.(ctx);

  if (drawInput) ctx.save();
  drawInput?.(ctx);

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const originalData = ctx.getImageData(0, 0, w, h);

  // Get configuration with defaults
  const {
    sourcePoints = [],
    targetPoints = [],
    strength = 1.0,
    regularization = 0.001,
  } = config || {};

  // Convert normalized points to TPSPoint format
  const srcPts: TPSPoint[] = sourcePoints.map((p) => ({ x: p.x, y: p.y }));
  const tgtPts: TPSPoint[] = targetPoints.map((p) => ({ x: p.x, y: p.y }));

  // Ensure we have matching pairs
  const numPoints = Math.min(srcPts.length, tgtPts.length);
  const actualSrc = srcPts.slice(0, numPoints);
  const actualTgt = tgtPts.slice(0, numPoints);

  // Create warper and apply transformation
  const warper = new ThinPlateSplinesWarper(
    w,
    h,
    actualSrc,
    actualTgt,
    strength,
    regularization,
  );

  const warpedData = warper.warpImage(originalData);
  ctx.putImageData(warpedData, 0, 0);

  if (drawInput) ctx.restore();
};

addRenderer("thinPlateSplines", {
  draw,
});

// ============================================================================
// Overlay Component
// ============================================================================

export const ThinPlatesSplinesOverlay: ItemOverlayFn<
  IThinPlatesSplinesConfig
> = ({ config, mutateConfig }) => {
  const { sourcePoints = [], targetPoints = [] } = config || {};

  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [isSource, setIsSource] = React.useState<boolean>(true);

  // Handle mouse down on a control point
  const handleMouseDown =
    (index: number, source: boolean) => (e: React.MouseEvent) => {
      e.preventDefault();
      setDraggedIndex(index);
      setIsSource(source);
    };

  // Handle mouse move to update point position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    mutateConfig((newConfig: IThinPlatesSplinesConfig) => {
      if (isSource) {
        const newSourcePoints = [...(newConfig.sourcePoints || [])];
        if (draggedIndex < newSourcePoints.length) {
          newSourcePoints[draggedIndex] = { x: normalizedX, y: normalizedY };
          newConfig.sourcePoints = newSourcePoints;
        } else {
          // Add new point
          newConfig.sourcePoints = [
            ...(newConfig.sourcePoints || []),
            { x: normalizedX, y: normalizedY },
          ];
        }
        // Ensure target point exists
        const newTargetPoints = [...(newConfig.targetPoints || [])];
        while (newTargetPoints.length <= draggedIndex) {
          newTargetPoints.push({ x: normalizedX, y: normalizedY });
        }
        newConfig.targetPoints = newTargetPoints;
      } else {
        const newTargetPoints = [...(newConfig.targetPoints || [])];
        if (draggedIndex < newTargetPoints.length) {
          newTargetPoints[draggedIndex] = { x: normalizedX, y: normalizedY };
          newConfig.targetPoints = newTargetPoints;
        } else {
          newConfig.targetPoints = [
            ...(newConfig.targetPoints || []),
            { x: normalizedX, y: normalizedY },
          ];
        }
        // Ensure source point exists
        const newSourcePoints = [...(newConfig.sourcePoints || [])];
        while (newSourcePoints.length <= draggedIndex) {
          newSourcePoints.push({ x: normalizedX, y: normalizedY });
        }
        newConfig.sourcePoints = newSourcePoints;
      }
    });
  };

  const handleMouseUp = () => {
    setDraggedIndex(null);
  };

  const handleMouseLeave = () => {
    setDraggedIndex(null);
  };

  // Add a new point pair
  const addPoint = () => {
    mutateConfig((newConfig: IThinPlatesSplinesConfig) => {
      newConfig.sourcePoints = [
        ...(newConfig.sourcePoints || []),
        { x: 0.5, y: 0.5 },
      ];
      newConfig.targetPoints = [
        ...(newConfig.targetPoints || []),
        { x: 0.5, y: 0.5 },
      ];
    });
  };

  // Remove a point pair
  const removePoint = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    mutateConfig((newConfig: IThinPlatesSplinesConfig) => {
      const newSourcePoints = [...(newConfig.sourcePoints || [])];
      const newTargetPoints = [...(newConfig.targetPoints || [])];
      newSourcePoints.splice(index, 1);
      newTargetPoints.splice(index, 1);
      newConfig.sourcePoints = newSourcePoints;
      newConfig.targetPoints = newTargetPoints;
    });
  };

  // Build points for rendering
  const points = [];
  const numPoints = Math.max(sourcePoints.length, targetPoints.length);

  for (let i = 0; i < numPoints; i++) {
    const src = sourcePoints[i] || { x: 0.5, y: 0.5 };
    const tgt = targetPoints[i] || { x: 0.5, y: 0.5 };

    // Source point (blue)
    points.push(
      <ControlPoint
        key={`src-${i}`}
        left={src.x}
        top={src.y}
        color="blue"
        draggable={true}
        onMouseDown={handleMouseDown(i, true)}
      />,
    );

    // Target point (green)
    points.push(
      <ControlPoint
        key={`tgt-${i}`}
        left={tgt.x}
        top={tgt.y}
        color="green"
        outer={false}
        draggable={true}
        onMouseDown={handleMouseDown(i, false)}
      />,
    );

    // Line connecting source to target
    points.push(
      <div
        key={`line-${i}`}
        style={{
          position: "absolute",
          left: `${src.x * 100}%`,
          top: `${src.y * 100}%`,
          width: `${Math.abs(tgt.x - src.x) * 100}%`,
          height: `${Math.abs(tgt.y - src.y) * 100}%`,
          border: "1px solid rgba(255, 255, 0, 0.5)",
          transform: `translate(${tgt.x > src.x ? 0 : -100}%, ${tgt.y > src.y ? 0 : -100}%) rotate(${Math.atan2(tgt.y - src.y, tgt.x - src.x)}rad)`,
          pointerEvents: "none",
          borderRadius: "0",
        }}
      />,
    );

    // Remove button for each pair
    points.push(
      <div
        key={`remove-${i}`}
        onClick={removePoint(i)}
        style={{
          position: "absolute",
          left: `${tgt.x * 100}%`,
          top: `${tgt.y * 100}%`,
          width: "20px",
          height: "20px",
          backgroundColor: "red",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transform: "translate(-50%, -50%)",
          fontSize: "12px",
          color: "white",
          userSelect: "none",
        }}
        title="Remove point"
      >
        ×
      </div>,
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.4)",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {points}
      <button
        onClick={addPoint}
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          padding: "5px 10px",
          backgroundColor: "rgba(255,255,255,0.7)",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        + Add Point
      </button>
    </div>
  );
};

addRendererOverlay("thinPlateSplines", ThinPlatesSplinesOverlay);
