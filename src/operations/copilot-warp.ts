import { IRenderItem } from "../canvas";

type ControlPoint = [x: number, y: number];

// mesh warp

function bilinearInterpolate(
  x: number,
  y: number,
  w: number,
  h: number,
  grid: ControlPoint[],
  rows: number,
  cols: number
) {
  // Find the cell in the grid that contains (x, y)
  const cellWidth = w / (cols - 1);
  const cellHeight = h / (rows - 1);
  const cellX = Math.floor(x / cellWidth);
  const cellY = Math.floor(y / cellHeight);

  // Clamp to grid bounds
  if (cellX < 0 || cellX >= cols - 1 || cellY < 0 || cellY >= rows - 1) {
    return [x, y]; // Return original position if out of bounds
  }

  // Get the four corners of the cell
  const p1 = grid[cellY * cols + cellX]; // Top-left
  const p2 = grid[cellY * cols + cellX + 1]; // Top-right
  const p3 = grid[(cellY + 1) * cols + cellX]; // Bottom-left
  const p4 = grid[(cellY + 1) * cols + cellX + 1]; // Bottom-right

  // Normalize (x, y) within the cell
  const t = (x % cellWidth) / cellWidth;
  const u = (y % cellHeight) / cellHeight;

  // Interpolate source coordinates
  const srcX =
    (1 - t) * (1 - u) * p1[0] +
    t * (1 - u) * p2[0] +
    (1 - t) * u * p3[0] +
    t * u * p4[0];

  const srcY =
    (1 - t) * (1 - u) * p1[1] +
    t * (1 - u) * p2[1] +
    (1 - t) * u * p3[1] +
    t * u * p4[1];

  return [srcX, srcY];
}

function warpImage(
  ctx: CanvasRenderingContext2D,
  controlPoints: ControlPoint[]
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const srcImageData = ctx.getImageData(0, 0, width, height);
  const dstImageData = new ImageData(width, height);
  const srcData = srcImageData.data;
  const dstData = dstImageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Get interpolated source coordinates
      const [srcX, srcY] = bilinearInterpolate(
        x,
        y,
        width,
        height,
        controlPoints,
        4,
        4
      );

      // Sample the source pixel (with nearest-neighbor for simplicity)
      const srcPixelX = Math.round(srcX);
      const srcPixelY = Math.round(srcY);

      if (
        srcPixelX >= 0 &&
        srcPixelX < width &&
        srcPixelY >= 0 &&
        srcPixelY < height
      ) {
        const srcIdx = (srcPixelY * width + srcPixelX) * 4;
        const dstIdx = (y * width + x) * 4;

        // Copy RGBA values
        dstData[dstIdx] = srcData[srcIdx]; // R
        dstData[dstIdx + 1] = srcData[srcIdx + 1]; // G
        dstData[dstIdx + 2] = srcData[srcIdx + 2]; // B
        dstData[dstIdx + 3] = srcData[srcIdx + 3]; // A
      }
    }
  }

  ctx.putImageData(dstImageData, 0, 0);
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
export const meshWarp = (): IRenderItem => ({
  name: "mesh-warp",
  draw(ctx, drawPrev, _config, drawChildren) {
    // Source grid (original positions)

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const srcGrid: ControlPoint[] = [
      [0, 0],
      [w / 3, 0],
      [(2 * w) / 3, 0],
      [w, 0],
      [0, h / 3],
      [w / 3, h / 3],
      [(2 * w) / 3, h / 3],
      [w, h / 3],
      [0, (2 * h) / 3],
      [w / 3, (2 * h) / 3],
      [(2 * w) / 3, (2 * h) / 3],
      [w, (2 * h) / 3],
      [0, h],
      [w / 3, h],
      [(2 * w) / 3, h],
      [w, h],
    ];

    // Destination grid (warped positions)
    const dstGrid = JSON.parse(JSON.stringify(srcGrid));
    const size = 40;
    dstGrid[5][0] += size;
    dstGrid[5][1] += size;

    dstGrid[6][0] -= size;
    dstGrid[6][1] += size;

    dstGrid[9][0] += size;
    dstGrid[9][1] -= size;

    dstGrid[10][0] -= size;
    dstGrid[10][1] -= size;

    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    warpImage(ctx, dstGrid);
    drawChildren?.(ctx);

    drawControlPoints(ctx, dstGrid);

    if (drawChildren) ctx.restore();
    return this;
  },
});
