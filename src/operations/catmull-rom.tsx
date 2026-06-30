import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRendererOverlay, ItemOverlayFn } from "../overlays";
import { addRenderer } from "../renderers";
import React from "react";
import { ControlPoint } from "../components/ControlPoint";

export interface ControlPointConfig {
  row: number;
  col: number;
  /** Normalized x displacement (0-1), where 0 is left edge and 1 is right edge */
  dx: number;
  /** Normalized y displacement (0-1), where 0 is top edge and 1 is bottom edge */
  dy: number;
}

export interface ICatmullRomConfig {
  gridRows?: number;
  gridCols?: number;
  strength?: number;
  controlPoints?: ControlPointConfig[];
}

export const catmullRom = (
  {
    gridRows = 3,
    gridCols = 3,
    strength = 10,
    controlPoints = [],
  }: ICatmullRomConfig,
  input: RenderTree,
): IRenderItem<ICatmullRomConfig> => ({
  name: "catmullRom",
  config: { strength, gridRows, gridCols, controlPoints },
  input,
});

// ============================================================================
// Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

// ============================================================================
// Catmull-Rom Interpolation
// ============================================================================

/**
 * 1D Catmull-Rom interpolation
 * p0-p3 are control values, t is fractional distance between p1 and p2 [0, 1]
 */
function catmullRom2(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

// ============================================================================
// Grid Warper
// ============================================================================

/**
 * Handles 2D grid deformation using Catmull-Rom splines
 */
class CatmullRomGridWarper {
  private width: number;
  private height: number;
  private rows: number;
  private cols: number;

  constructor(width: number, height: number, rows: number, cols: number) {
    this.width = width;
    this.height = height;
    this.rows = rows;
    this.cols = cols;
  }

  /**
   * Warps the source image based on the deformed destination grid
   */
  public warpImage(sourceData: ImageData, destGrid: Point[][]): ImageData {
    const targetData = new ImageData(this.width, this.height);
    const srcPixels = new Uint32Array(sourceData.data.buffer);
    const dstPixels = new Uint32Array(targetData.data.buffer);

    const R = this.rows;
    const C = this.cols;

    // Boundary helper to clamp grid indexes to valid control ranges
    const clampRow = (r: number) => Math.max(0, Math.min(R - 1, r));
    const clampCol = (c: number) => Math.max(0, Math.min(C - 1, c));

    // For every target pixel, find its corresponding source location via Bicubic Catmull-Rom Interpolation
    for (let y = 0; y < this.height; y++) {
      // 1. Find normalized vertical position in the grid layout
      const vNormalized = (y / (this.height - 1)) * (R - 1);
      const r1 = Math.floor(vNormalized);
      const r2 = clampRow(r1 + 1);
      const r0 = clampRow(r1 - 1);
      const r3 = clampRow(r1 + 2);
      const tY = vNormalized - r1; // fractional vertical distance

      for (let x = 0; x < this.width; x++) {
        // 2. Find normalized horizontal position in the grid layout
        const uNormalized = (x / (this.width - 1)) * (C - 1);
        const c1 = Math.floor(uNormalized);
        const c2 = clampCol(c1 + 1);
        const c0 = clampCol(c1 - 1);
        const c3 = clampCol(c1 + 2);
        const tX = uNormalized - c1; // fractional horizontal distance

        // 3. Perform Bicubic Catmull-Rom evaluation on the Destination Mesh to trace back displacements
        // We evaluate X and Y coordinates independently over the 4x4 surrounding grid patch
        const arrX = [0, 0, 0, 0];
        const arrY = [0, 0, 0, 0];

        const rowsTrack = [r0, r1, r2, r3];
        const colsTrack = [c0, c1, c2, c3];

        for (let i = 0; i < 4; i++) {
          const rowIdx = rowsTrack[i];

          // Interpolate horizontally for each of the 4 rows
          const p0 = destGrid[rowIdx][colsTrack[0]];
          const p1 = destGrid[rowIdx][colsTrack[1]];
          const p2 = destGrid[rowIdx][colsTrack[2]];
          const p3 = destGrid[rowIdx][colsTrack[3]];

          arrX[i] = catmullRom2(p0.x, p1.x, p2.x, p3.x, tX);
          arrY[i] = catmullRom2(p0.y, p1.y, p2.y, p3.y, tX);
        }

        // Interpolate vertically across the horizontal results to find actual targeted coordinate
        const targetX = catmullRom2(arrX[0], arrX[1], arrX[2], arrX[3], tY);
        const targetY = catmullRom2(arrY[0], arrY[1], arrY[2], arrY[3], tY);

        // 4. Calculate displacements to map back to original source space
        const dispX = targetX - x;
        const dispY = targetY - y;

        // Source lookup location
        const srcX = x - dispX;
        const srcY = y - dispY;

        // 5. Bilinear sample from the source pixel array
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

          // Unpack 32-bit colors to components for performance
          const p00 = srcPixels[idx00];
          const p10 = srcPixels[idx10];
          const p01 = srcPixels[idx01];
          const p11 = srcPixels[idx11];

          // Bilinear blending channel by channel
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
          // Out of bounds fallback: Keep transparent or solid edge
          dstPixels[y * this.width + x] = 0x00000000;
        }
      }
    }

    return targetData;
  }
}
// ============================================================================
// Draw Function
// ============================================================================

export const draw: ItemDrawFn<ICatmullRomConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
  const drawInput = drawArgs?.[0];
  if (drawInput) {
    ctx.save();
    drawInput(ctx);

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const originalData = ctx.getImageData(0, 0, w, h);

    // Get grid resolution from config (defaults to 4x4)
    const rows = config?.gridRows || 4;
    const cols = config?.gridCols || 4;

    const warper = new CatmullRomGridWarper(w, h, rows, cols);

    // Initialize grids: source (unchanged) and destination (will be deformed)
    const sourceGrid: Point[][] = [];
    const destGrid: Point[][] = [];

    for (let r = 0; r < rows; r++) {
      sourceGrid[r] = [];
      destGrid[r] = [];
      const y = (r / (rows - 1)) * h;

      for (let c = 0; c < cols; c++) {
        const x = (c / (cols - 1)) * w;

        sourceGrid[r][c] = { x, y };
        destGrid[r][c] = { x, y }; // Defaults match origin
      }
    }

    // Apply configured control point offsets to destination grid
    // dx and dy are normalized (0-1), where 0 is left/top and 1 is right/bottom
    if (config?.controlPoints) {
      for (const cpConfig of config.controlPoints) {
        const { row, col, dx, dy } = cpConfig;
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          destGrid[row][col].x += dx * w;
          destGrid[row][col].y += dy * h;
        }
      }
    }

    // Process the pixel warp structure via Catmull-Rom
    const warpedData = warper.warpImage(originalData, destGrid);
    ctx.putImageData(warpedData, 0, 0);

    ctx.restore();
  }

  // Draw Previous behind it, so we don't need to create an new layer/RenderingContext2D
  ctx.globalCompositeOperation = "destination-over";
  drawPrev?.(ctx);
  ctx.globalCompositeOperation = "source-over";
};

addRenderer("catmullRom", {
  draw,
});

// ============================================================================
// Overlay Component
// ============================================================================

export const CatmullRomOverlay: ItemOverlayFn<ICatmullRomConfig> = ({
  config,
  mutateConfig,
}) => {
  const rows = config?.gridRows || 4;
  const cols = config?.gridCols || 4;
  const [draggedPoint, setDraggedPoint] = React.useState<{
    row: number;
    col: number;
  } | null>(null);

  const handleMouseDown =
    (row: number, col: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      setDraggedPoint({ row, col });
    };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedPoint === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    const baseLeft = draggedPoint.col / (cols - 1);
    const baseTop = draggedPoint.row / (rows - 1);

    const newDx = normalizedX - baseLeft;
    const newDy = normalizedY - baseTop;

    mutateConfig((newConfig: ICatmullRomConfig) => {
      const newControlPoints = [...(newConfig.controlPoints || [])];
      const existingIndex = newControlPoints.findIndex(
        (cp) => cp.row === draggedPoint.row && cp.col === draggedPoint.col,
      );

      if (existingIndex >= 0) {
        // Update existing control point
        newControlPoints[existingIndex] = {
          ...newControlPoints[existingIndex],
          dx: newDx,
          dy: newDy,
        };
      } else {
        // Create new control point
        newControlPoints.push({
          row: draggedPoint.row,
          col: draggedPoint.col,
          dx: newDx,
          dy: newDy,
        });
      }
      newConfig.controlPoints = newControlPoints;
    });
  };

  const handleMouseUp = () => {
    setDraggedPoint(null);
  };

  const handleMouseLeave = () => {
    setDraggedPoint(null);
  };

  const dots = [];

  // Build map of configured control points for quick lookup
  const controlPointMap: Record<string, ControlPointConfig> = {};
  if (config?.controlPoints) {
    for (const cp of config.controlPoints) {
      controlPointMap[`${cp.row}-${cp.col}`] = cp;
    }
  }

  // Draw all grid points and control points
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const baseLeft = c / (cols - 1);
      const baseTop = r / (rows - 1);
      const cp = controlPointMap[`${r}-${c}`];

      // Blue grid point (outer circle)
      dots.push(
        <ControlPoint
          key={`dot-${r}-${c}`}
          left={baseLeft}
          top={baseTop}
          color="blue"
        />,
      );

      // Green control point (filled circle) - either at base position or offset
      const cpLeft = cp ? baseLeft + cp.dx : baseLeft;
      const cpTop = cp ? baseTop + cp.dy : baseTop;
      dots.push(
        <ControlPoint
          key={`cp-${r}-${c}`}
          left={cpLeft}
          top={cpTop}
          color="green"
          outer={false}
          draggable={true}
          onMouseDown={handleMouseDown(r, c)}
        />,
      );
    }
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
      {dots}
    </div>
  );
};

addRendererOverlay("catmullRom", CatmullRomOverlay);
