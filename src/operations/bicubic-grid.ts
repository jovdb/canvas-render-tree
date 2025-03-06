import { IRenderItem, ItemDrawFn } from "../canvas";
import { addRenderer } from "../renderers";

interface Point {
  x: number;
  y: number;
}

interface Vector {
  dx: number;
  dy: number;
}

function deformImage(
  imageData: ImageData,
  /** Normalized control points */
  controlPoints: Point[][]
): ImageData {
  const { width, height } = imageData;
  const rows = controlPoints.length;
  const cols = controlPoints[0].length;

  const originalGrid = createOriginalGrid(rows, cols, width, height);
  const destinationGrid = JSON.parse(JSON.stringify(controlPoints));
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      destinationGrid[j][i].x *= width;
      destinationGrid[j][i].y *= height;
    }
  }
  const displacements = calculateDisplacements(originalGrid, destinationGrid);
  const output = new ImageData(width, height);

  const gridWidth = width / (cols - 1);
  const gridHeight = height / (rows - 1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Find current grid cell
      const i = Math.max(0, Math.min(Math.floor(x / gridWidth), cols - 2));
      const j = Math.max(0, Math.min(Math.floor(y / gridHeight), rows - 2));

      // Normalized coordinates within grid cell
      const gx = (x - i * gridWidth) / gridWidth;
      const gy = (y - j * gridHeight) / gridHeight;

      // Get 4x4 grid of displacements for bicubic interpolation
      const dispGridX = createDisplacementGrid(displacements, i, j, "dx");
      const dispGridY = createDisplacementGrid(displacements, i, j, "dy");

      // Bicubic interpolation of displacements
      const dx = bicubicInterpolate(dispGridX, gx, gy);
      const dy = bicubicInterpolate(dispGridY, gx, gy);

      // Calculate source coordinates
      const srcX = x - dx;
      const srcY = y - dy;

      // Calculate transparency at edges
      const edgeSubPixelSize = 2;
      const coverage = calculatePixelTransparency(
        srcX,
        srcY,
        width,
        height,
        edgeSubPixelSize
      );

      // Sample source pixel
      const pixel =
        coverage > 0
          ? sampleBicubic(imageData, srcX, srcY)
          : // ? sampleRound(imageData, srcX, srcY)
            new Uint8ClampedArray([0, 0, 0, 0]);

      // Apply edge anti-aliasing
      pixel[3] = Math.round(pixel[3] * coverage);

      setPixel(output, x, y, pixel);
    }
  }

  return output;
}

function createDisplacementGrid(
  displacements: Vector[][],
  i: number,
  j: number,
  component: "dx" | "dy"
): number[][] {
  const grid: number[][] = [];
  for (let dj = -1; dj <= 2; dj++) {
    const row: number[] = [];
    for (let di = -1; di <= 2; di++) {
      const ci = clamp(i + di, 0, displacements[0].length - 1);
      const cj = clamp(j + dj, 0, displacements.length - 1);
      row.push(displacements[cj][ci][component]);
    }
    grid.push(row);
  }
  return grid;
}

function bicubicInterpolate(
  values: number[][],
  tx: number,
  ty: number
): number {
  // Interpolate rows first
  const rowResults = values.map((row) => cubicInterpolate(row, tx));
  return cubicInterpolate(rowResults, ty);
}

function cubicInterpolate(values: number[], t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    ((-values[0] + 3 * values[1] - 3 * values[2] + values[3]) * t3 +
      (2 * values[0] - 5 * values[1] + 4 * values[2] - values[3]) * t2 +
      (-values[0] + values[2]) * t +
      2 * values[1])
  );
}

// pixelated
function sampleRound(imageData: ImageData, x: number, y: number) {
  if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
    return new Uint8ClampedArray([0, 0, 0, 0]);
  }

  const rx = Math.round(x);
  const ry = Math.round(y);

  return new Uint8ClampedArray([
    imageData.data[(ry * imageData.width + rx) * 4],
    imageData.data[(ry * imageData.width + rx) * 4 + 1],
    imageData.data[(ry * imageData.width + rx) * 4 + 2],
    imageData.data[(ry * imageData.width + rx) * 4 + 3],
  ]);
}

function sampleBicubic(
  imageData: ImageData,
  x: number,
  y: number
): Uint8ClampedArray {
  const x0 = Math.floor(x) - 1;
  const y0 = Math.floor(y) - 1;
  const valuesR: number[][] = [];
  const valuesG: number[][] = [];
  const valuesB: number[][] = [];
  const valuesA: number[][] = [];

  for (let j = 0; j < 4; j++) {
    const rowR: number[] = [];
    const rowG: number[] = [];
    const rowB: number[] = [];
    const rowA: number[] = [];
    for (let i = 0; i < 4; i++) {
      const xi = clamp(x0 + i, 0, imageData.width - 1);
      const yj = clamp(y0 + j, 0, imageData.height - 1);
      const idx = (yj * imageData.width + xi) * 4;
      rowR.push(imageData.data[idx]);
      rowG.push(imageData.data[idx + 1]);
      rowB.push(imageData.data[idx + 2]);
      rowA.push(imageData.data[idx + 3]);
    }
    valuesR.push(rowR);
    valuesG.push(rowG);
    valuesB.push(rowB);
    valuesA.push(rowA);
  }

  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);

  return new Uint8ClampedArray([
    bicubicInterpolate(valuesR, fx, fy),
    bicubicInterpolate(valuesG, fx, fy),
    bicubicInterpolate(valuesB, fx, fy),
    bicubicInterpolate(valuesA, fx, fy),
  ]);
}

function calculatePixelTransparency(
  x: number,
  y: number,
  width: number,
  height: number,
  margin = 1
): number {
  // Horizontal coverage (left/right edges)
  const left = x < 0 ? smoothstep(-margin, 0, x) : 1;
  const right = x > width ? 1 - smoothstep(width, width + margin, x) : 1;
  const horizontal = left * right;

  // Vertical coverage (top/bottom edges)
  const top = y < 0 ? smoothstep(-margin, 0, y) : 1;
  const bottom = y > height ? 1 - smoothstep(height, height + margin, y) : 1;
  const vertical = top * bottom;

  return horizontal * vertical;
}

/**
 * @returns
 * value ≤ startRange: 0
 * value >= endRange: 1
 * in range: Smooth transition between 0 and 1
 */
function smoothstep(
  startRange: number,
  endRange: number,
  value: number
): number {
  const t = Math.max(
    0,
    Math.min(1, (value - startRange) / (endRange - startRange))
  );
  // Cubic polynomial
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function createOriginalGrid(
  rows: number,
  cols: number,
  width = 1,
  height = 1
): Point[][] {
  const grid: Point[][] = [];
  for (let j = 0; j < rows; j++) {
    const row: Point[] = [];
    for (let i = 0; i < cols; i++) {
      row.push({
        x: (i * width) / (cols - 1),
        y: (j * height) / (rows - 1),
      });
    }
    grid.push(row);
  }
  return grid;
}

function calculateDisplacements(
  original: Point[][],
  deformed: Point[][]
): Vector[][] {
  const displacements: Vector[][] = [];
  for (let j = 0; j < original.length; j++) {
    const row: Vector[] = [];
    for (let i = 0; i < original[j].length; i++) {
      row.push({
        dx: deformed[j][i].x - original[j][i].x,
        dy: deformed[j][i].y - original[j][i].y,
      });
    }
    displacements.push(row);
  }
  return displacements;
}

function setPixel(
  imageData: ImageData,
  x: number,
  y: number,
  pixel: Uint8ClampedArray
) {
  const i = (y * imageData.width + x) * 4;
  imageData.data.set(pixel, i);
}

function drawControlPointDisplacement(
  ctx: CanvasRenderingContext2D,
  point1: Point,
  point2: Point,
  radius = 5
) {
  ctx.save(); // Save current canvas state

  // Draw grid lines
  ctx.save();
  ctx.globalCompositeOperation = "difference";
  ctx.strokeStyle = "#bbbb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(point1.x * ctx.canvas.width, point1.y * ctx.canvas.height);
  ctx.lineTo(point2.x * ctx.canvas.width, point2.y * ctx.canvas.height);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "red";
  ctx.strokeStyle = "#000a";
  ctx.beginPath();
  ctx.arc(
    point1.x * ctx.canvas.width,
    point1.y * ctx.canvas.height,
    radius,
    0,
    Math.PI * 2
  ); // Draw circle at control point
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "green";
  ctx.strokeStyle = "#000a";
  ctx.beginPath();
  ctx.arc(
    point2.x * ctx.canvas.width,
    point2.y * ctx.canvas.height,
    radius,
    0,
    Math.PI * 2
  ); // Draw circle at control point
  ctx.fill();
  ctx.stroke();
  ctx.stroke();

  ctx.restore(); // Restore original canvas state
}
export interface IBicubicGridConfig {
  /** Normalized controlPoints */
  controlsPoints: Point[][];
  debug?: boolean;
}

export const bicubicGrid = (
  config: IBicubicGridConfig
): IRenderItem<IBicubicGridConfig> => ({
  name: "bicubicGrid",
  config: config,
});

export const draw: ItemDrawFn<IBicubicGridConfig> = (
  ctx,
  drawPrev,
  config,
  drawChildren
) => {
  drawPrev?.(ctx);
  if (drawChildren) ctx.save();

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const newImageData = deformImage(imageData, config.controlsPoints);
  ctx.putImageData(newImageData, 0, 0);

  if (config?.debug) {
    const rows = config.controlsPoints.length;
    const cols = config.controlsPoints[0].length;
    const originalGrid = createOriginalGrid(rows, cols);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        drawControlPointDisplacement(
          ctx,
          originalGrid[j][i],
          config.controlsPoints[j][i]
        );
      }
    }
  }

  drawChildren?.(ctx);
  if (drawChildren) ctx.restore();
};

addRenderer("bicubicGrid", {
  draw,
});
