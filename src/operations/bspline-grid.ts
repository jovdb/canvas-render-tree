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
  controlPoints: Point[][]
): ImageData {
  const { width, height } = imageData;
  const rows = controlPoints.length;
  const cols = controlPoints[0].length;

  const originalGrid = createOriginalGrid(width, height, rows, cols);
  const displacements = calculateDisplacements(originalGrid, controlPoints);
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

      // Sample and set pixel
      const pixel = sampleBicubic(imageData, srcX, srcY);
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

function sampleBicubic(
  imageData: ImageData,
  x: number,
  y: number
): Uint8ClampedArray {
  if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
    return new Uint8ClampedArray([0, 0, 0, 0]);
  }

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function createOriginalGrid(
  width: number,
  height: number,
  rows: number,
  cols: number
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

export interface IBSplineGridConfig {
  blendMode: GlobalCompositeOperation;
}

export const bSplineGrid = (): IRenderItem<IBSplineGridConfig> => ({
  name: "bspline-grid",
});

export const draw: ItemDrawFn<IBSplineGridConfig> = (
  ctx,
  drawPrev,
  config,
  drawChildren
) => {
  drawPrev?.(ctx);
  if (drawChildren) ctx.save();

  const deformationGrid = createOriginalGrid(
    ctx.canvas.width,
    ctx.canvas.height,
    5,
    5
  );
  deformationGrid[0][1].x += 50;
  deformationGrid[0][1].y += 50;
  deformationGrid[0][2].x -= 50;
  deformationGrid[0][2].y -= 50;

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const newImageData = deformImage(imageData, deformationGrid);
  ctx.putImageData(newImageData, 0, 0);

  drawChildren?.(ctx);
  if (drawChildren) ctx.restore();
};

addRenderer("bspline-grid", {
  draw,
});
