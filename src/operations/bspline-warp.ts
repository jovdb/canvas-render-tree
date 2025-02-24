import { IRenderItem } from "../canvas";

interface Point {
  x: number;
  y: number;
}

class BSplineWarper {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  public controlPoints: Point[][];
  private degree: number = 3; // Cubic B-Spline

  constructor(
    private canvas: HTMLCanvasElement,
    private originalImage: ImageData
  ) {
    this.ctx = canvas.getContext("2d")!;
    if (!this.ctx) {
      throw new Error("Could not get 2D context");
    }
    this.width = originalImage.width;
    this.height = originalImage.height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.controlPoints = [];

    // Initialize control points (e.g., a 4x4 grid)
    this.initializeControlPoints(2, 2);
    this.addControlPointInteraction();
    this.drawImage(originalImage);
  }

  private initializeControlPoints(rows: number, cols: number) {
    const xSpacing = this.width / (cols + 1);
    const ySpacing = this.height / (rows + 1);

    const randomOffset = 0;
    for (let i = 0; i < rows + 2; i++) {
      // +2 for padding
      this.controlPoints[i] = [];
      for (let j = 0; j < cols + 2; j++) {
        // +2 for padding
        this.controlPoints[i][j] = {
          x: j * xSpacing + Math.random() * randomOffset * 2 - randomOffset, // Add random offset for better visualization
          y: i * ySpacing + Math.random() * randomOffset * 2 - randomOffset, // Add random offset for better visualization,
        };
      }
    }

    const cp = this.controlPoints[2][2];
    cp.x += 80;
    cp.y += 80;
  }

  private drawImage(image: ImageData) {
    this.ctx.putImageData(image, 0, 0);
  }

  public drawControlPoints(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "red";
    ctx.strokeStyle = "gray";

    for (let i = 0; i < this.controlPoints.length; i++) {
      for (let j = 0; j < this.controlPoints[i].length; j++) {
        const point = this.controlPoints[i][j];
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Optional: Draw lines connecting control points
        if (j < this.controlPoints[i].length - 1) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(
            this.controlPoints[i][j + 1].x,
            this.controlPoints[i][j + 1].y
          );
          ctx.stroke();
        }
        if (i < this.controlPoints.length - 1) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(
            this.controlPoints[i + 1][j].x,
            this.controlPoints[i + 1][j].y
          );
          ctx.stroke();
        }
      }
    }
  }

  private basis(i: number, k: number, u: number, knots: number[]): number {
    if (k === 0) {
      return knots[i] <= u && u < knots[i + 1] ? 1 : 0;
    }

    let firstTermNumerator = (u - knots[i]) * this.basis(i, k - 1, u, knots);
    let firstTermDenominator = knots[i + k] - knots[i];

    // Avoid division by zero
    let firstTerm =
      firstTermDenominator !== 0
        ? firstTermNumerator / firstTermDenominator
        : 0;

    let secondTermNumerator =
      (knots[i + k + 1] - u) * this.basis(i + 1, k - 1, u, knots);
    let secondTermDenominator = knots[i + k + 1] - knots[i + 1];
    // Avoid division by zero
    let secondTerm =
      secondTermDenominator !== 0
        ? secondTermNumerator / secondTermDenominator
        : 0;

    return firstTerm + secondTerm;
  }

  private generateKnots(numControlPoints: number, degree: number): number[] {
    const knots = [];
    // Create knot vector (clamped, uniform)
    for (let i = 0; i < degree + 1; i++) {
      knots.push(0);
    }
    for (let i = 1; i < numControlPoints - degree; i++) {
      knots.push(i);
    }
    for (let i = 0; i < degree + 1; i++) {
      knots.push(numControlPoints - degree);
    }
    return knots;
  }

  private warpPixel(x: number, y: number): Point {
    let u = (x / this.width) * (this.controlPoints[0].length - this.degree); //Map pixel to control point index
    let v = (y / this.height) * (this.controlPoints.length - this.degree);

    let knotsX = this.generateKnots(this.controlPoints[0].length, this.degree);
    let knotsY = this.generateKnots(this.controlPoints.length, this.degree);

    let warpedX = 0;
    let warpedY = 0;

    for (let i = 0; i < this.controlPoints.length; i++) {
      for (let j = 0; j < this.controlPoints[i].length; j++) {
        const basisX = this.basis(j, this.degree, u, knotsX);
        const basisY = this.basis(i, this.degree, v, knotsY);
        warpedX += this.controlPoints[i][j].x * basisX * basisY;
        warpedY += this.controlPoints[i][j].y * basisX * basisY;
      }
    }

    return { x: warpedX, y: warpedY };
  }

  public warp() {
    const warpedImageData = this.ctx.createImageData(this.width, this.height);
    const originalData = this.originalImage.data;
    const warpedData = warpedImageData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const warpedPoint = this.warpPixel(x, y);

        // Nearest-neighbor interpolation (for simplicity)
        const srcX = Math.round(warpedPoint.x);
        const srcY = Math.round(warpedPoint.y);

        // Bounds check
        if (srcX >= 0 && srcX < this.width && srcY >= 0 && srcY < this.height) {
          const srcIndex = (srcY * this.width + srcX) * 4;
          const dstIndex = (y * this.width + x) * 4;

          warpedData[dstIndex] = originalData[srcIndex]; // R
          warpedData[dstIndex + 1] = originalData[srcIndex + 1]; // G
          warpedData[dstIndex + 2] = originalData[srcIndex + 2]; // B
          warpedData[dstIndex + 3] = originalData[srcIndex + 3]; // A
        }
      }
    }
    return warpedImageData;
  }

  private addControlPointInteraction() {
    let draggedPoint: Point | null = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const getMousePos = (event: MouseEvent): Point => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    this.canvas.addEventListener("mousedown", (event) => {
      const mousePos = getMousePos(event);
      // Find closest control point
      for (let i = 0; i < this.controlPoints.length; i++) {
        for (let j = 0; j < this.controlPoints[i].length; j++) {
          const point = this.controlPoints[i][j];
          const distance = Math.sqrt(
            (mousePos.x - point.x) ** 2 + (mousePos.y - point.y) ** 2
          );
          if (distance < 10) {
            // 10 pixel radius
            draggedPoint = point;
            dragOffsetX = mousePos.x - point.x;
            dragOffsetY = mousePos.y - point.y;
            break;
          }
        }
      }
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (draggedPoint) {
        const mousePos = getMousePos(event);
        draggedPoint.x = mousePos.x - dragOffsetX;
        draggedPoint.y = mousePos.y - dragOffsetY;
        this.warp();
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      draggedPoint = null;
    });

    this.canvas.addEventListener("mouseleave", () => {
      // Stop dragging if mouse leaves canvas
      draggedPoint = null;
    });
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
  draw(ctx, drawPrev, drawChildren) {
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

    const warper = new BSplineWarper(canvas, originalData);
    const warpedData = warper.warp();

    //drawControlPoints(ctx, warper.controlPoints);
    ctx.putImageData(warpedData, 0, 0);
    warper.drawControlPoints(ctx);

    //     drawControlPoints(ctx, warp.controlPoints);

    if (drawChildren) ctx.restore();
    return this;
  },
});
