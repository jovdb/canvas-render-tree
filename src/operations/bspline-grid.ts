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
      const i = Math.max(0, Math.min(Math.floor(x / gridWidth), cols - 2));
      const j = Math.max(0, Math.min(Math.floor(y / gridHeight), rows - 2));

      const gx = (x - i * gridWidth) / gridWidth;
      const gy = (y - j * gridHeight) / gridHeight;

      const d00 = displacements[j][i];
      const d10 = displacements[j][i + 1];
      const d01 = displacements[j + 1][i];
      const d11 = displacements[j + 1][i + 1];

      const dx = bilinearInterpolate(d00.dx, d10.dx, d01.dx, d11.dx, gx, gy);
      const dy = bilinearInterpolate(d00.dy, d10.dy, d01.dy, d11.dy, gx, gy);

      const srcX = x - dx;
      const srcY = y - dy;

      const pixel = sampleBilinear(imageData, srcX, srcY);
      setPixel(output, x, y, pixel);
    }
  }

  return output;
}

function sampleBilinear(
  imageData: ImageData,
  x: number,
  y: number
): Uint8ClampedArray {
  // Return transparent pixel if coordinates are outside the image
  if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
    return new Uint8ClampedArray([0, 0, 0, 0]);
  }

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(imageData.width - 1, x0 + 1);
  const y1 = Math.min(imageData.height - 1, y0 + 1);

  const fx = x - x0;
  const fy = y - y0;

  const i00 = (y0 * imageData.width + x0) * 4;
  const i10 = (y0 * imageData.width + x1) * 4;
  const i01 = (y1 * imageData.width + x0) * 4;
  const i11 = (y1 * imageData.width + x1) * 4;

  const result = new Uint8ClampedArray(4);
  for (let c = 0; c < 4; c++) {
    const v00 = imageData.data[i00 + c];
    const v10 = imageData.data[i10 + c];
    const v01 = imageData.data[i01 + c];
    const v11 = imageData.data[i11 + c];

    result[c] = Math.round(
      (1 - fy) * ((1 - fx) * v00 + fx * v10) + fy * ((1 - fx) * v01 + fx * v11)
    );
  }
  return result;
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

function bilinearInterpolate(
  v00: number,
  v10: number,
  v01: number,
  v11: number,
  gx: number,
  gy: number
): number {
  return (
    (1 - gy) * ((1 - gx) * v00 + gx * v10) + gy * ((1 - gx) * v01 + gx * v11)
  );
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
