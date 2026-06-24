import { IRenderItem, ItemDrawFn } from "../canvas";
import { addRenderer } from "../renderers";

export interface IFillColorConfig {
  color: string;
}

export const catmullRom = (
  rows = 3,
  cols = 3,
  strength = 10,
): IRenderItem<IBSplinePointsConfig> => ({
  name: "catmull-rom",
  config: {
    strength,
    gridRows: rows,
    gridCols: cols,
  },
});

// Define internal structural types
export interface Point {
  x: number;
  y: number;
}

export interface IBSplinePointsConfig {
  strength?: number; // Maps to your lambda/interpolation factor if needed
  gridRows?: number; // e.g., 4
  gridCols?: number; // e.g., 4
}

/**
 * 1D Catmull-Rom Interpolation helper
 * p0, p1, p2, p3 are control values. t is the fractional distance between p1 and p2 [0, 1].
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

/**
 * Class handling the 2D grid deformation using Catmull-Rom Splines
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
   * Warps the source image data based on a source grid and deformed destination grid
   */
  public warpImage(
    sourceData: ImageData,
    sourceGrid: Point[][],
    destGrid: Point[][],
  ): ImageData {
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

// Dummy helper matching your interface to draw handles
function drawControlPoint(
  ctx: CanvasRenderingContext2D,
  current: Point,
  origin: Point,
) {
  ctx.beginPath();
  ctx.arc(current.x, current.y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "#00ff00";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(current.x, current.y);
  ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
  ctx.stroke();
}

/**
 * Core Draw Function Replacement Execution
 */
export const draw: ItemDrawFn<IBSplinePointsConfig> = (
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

  // Define grid resolution (e.g., a 4x4 matrix of interactive control points)
  const rows = config?.gridRows || 4;
  const cols = config?.gridCols || 4;

  const warper = new CatmullRomGridWarper(w, h, rows, cols);

  // Initialize reference grids
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

  // --- Test Data Manipulations ---
  // Let's warp two intersections in the middle rows dynamically to test the engine
  if (rows > 2 && cols > 2) {
    // Push the point at row 1, col 1 downwards-right
    destGrid[1][1].x += 40;
    destGrid[1][1].y += 50;

    // Push the point at row 2, col 1 upwards-left
    destGrid[2][1].x -= 30;
    destGrid[2][1].y -= 40;
  }

  // Process the pixel warp structure via Catmull-Rom
  const warpedData = warper.warpImage(originalData, sourceGrid, destGrid);
  ctx.putImageData(warpedData, 0, 0);

  // Draw control points overlay lines showing displacement
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Only draw indicators for handles that actually shifted
      if (
        sourceGrid[r][c].x !== destGrid[r][c].x ||
        sourceGrid[r][c].y !== destGrid[r][c].y
      ) {
        drawControlPoint(ctx, destGrid[r][c], sourceGrid[r][c]);
      }
    }
  }

  if (drawInput) ctx.restore();
};

addRenderer("catmull-rom", {
  draw,
});
