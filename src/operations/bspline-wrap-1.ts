import { IRenderItem } from "../canvas";
type ControlPoint = [x: number, y: number];

// mesh warp

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

export class BSpline {
  private _domain: number[];
  private _low: number;
  private _high: number;
  private _d: number;
  private _n: number;

  constructor(
    public degree: number,
    public points: Array<Array<number>>,
    public knots: Array<number> = [],
    public weights: Array<number> = []
  ) {
    let n = (this._n = points.length); // points count
    this._d = points[0].length; // point dimensionality

    if (degree < 1) throw new Error("degree must be at least 1 (linear)");
    if (degree > n - 1)
      throw new Error("degree must be less than or equal to point count - 1");

    if (this.weights.length === 0) {
      // build weight vector of length [n]
      for (let i = 0; i < n; i++) {
        this.weights[i] = 1;
      }
    }

    if (this.knots.length === 0) {
      // build knot vector of length [n + degree + 1]
      for (let i = 0; i < n + degree + 1; i++) {
        knots[i] = i;
      }
    } else {
      if (this.knots.length !== n + degree + 1)
        throw new Error("bad knot vector length");
    }
    this._domain = [degree, knots.length - 1 - degree];

    this._low = knots[this._domain[0]];
    this._high = knots[this._domain[1]];
  }

  getPoint(t: number, result: Array<number> = []): Array<number> {
    const d = this._d;

    // remap t to the domain where the spline is defined
    t = t * (this._high - this._low) + this._low;
    if (t < this._low || t > this._high) throw new Error("out of bounds");

    let splineSegment: number;
    // find splineSegment for the [t] value provided
    for (
      splineSegment = this._domain[0];
      splineSegment < this._domain[1];
      splineSegment++
    ) {
      if (
        t >= this.knots[splineSegment] &&
        t <= this.knots[splineSegment + 1]
      ) {
        break;
      }
    }
    // convert points to homogeneous coordinates
    let v: Array<Array<number>> = [];
    for (let i = 0; i < this._n; i++) {
      v[i] = [];
      for (let j = 0; j < d; j++) {
        v[i][j] = this.points[i][j] * this.weights[i];
      }
      v[i][d] = this.weights[i];
    }

    // l (level) goes from 1 to the curve degree + 1
    let alpha: number;
    for (let l = 1; l <= this.degree + 1; l++) {
      // build level l of the pyramid
      for (
        let i = splineSegment;
        i > splineSegment - this.degree - 1 + l;
        i--
      ) {
        alpha =
          (t - this.knots[i]) /
          (this.knots[i + this.degree + 1 - l] - this.knots[i]);

        // interpolate each component
        for (let j = 0; j < d + 1; j++) {
          v[i][j] = (1 - alpha) * v[i - 1][j] + alpha * v[i][j];
        }
      }
    }

    // convert back to cartesian and return
    for (let i = 0; i < d; i++) {
      result[i] = v[splineSegment][i] / v[splineSegment][d];
    }

    return result;
  }
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
  draw(ctx, drawPrev, _config, drawChildren) {
    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    drawChildren?.(ctx);

    // 1. Define control points (example: 4x4 grid)
    const canvas = ctx.canvas;
    const controlPointsX: ControlPoint[] = [
      [0, 0],
      [canvas.width / 2, 0],
      [canvas.width, 0],
      [0, canvas.height / 2],
      [canvas.width / 2, canvas.height / 2],
      [canvas.width, canvas.height / 2],
      [0, canvas.height],
      [canvas.width / 2, canvas.height],
      [canvas.width, canvas.height],
    ];

    const controlPointsY: ControlPoint[] = [
      [0, 0],
      [0, canvas.height / 2],
      [0, canvas.height],
      [canvas.width / 2, 0],
      [canvas.width / 2, canvas.height / 2],
      [canvas.width / 2, canvas.height],
      [canvas.width, 0],
      [canvas.width, canvas.height / 2],
      [canvas.width, canvas.height],
    ];

    const degree = 2;
    const bSplineX = new BSpline(degree, controlPointsX);
    const bSplineY = new BSpline(degree, controlPointsY);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const warpedImageData = ctx.createImageData(canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const u = x / canvas.width;
        const v = y / canvas.height;

        const [sourceX] = bSplineX.getPoint(u);
        const [sourceY] = bSplineY.getPoint(v);

        if (
          sourceX >= 0 &&
          sourceX < canvas.width &&
          sourceY >= 0 &&
          sourceY < canvas.height
        ) {
          const sourceIndex =
            (Math.floor(sourceY) * canvas.width + Math.floor(sourceX)) * 4;
          const destIndex = (y * canvas.width + x) * 4;

          warpedImageData.data[destIndex] = imageData.data[sourceIndex];
          warpedImageData.data[destIndex + 1] = imageData.data[sourceIndex + 1];
          warpedImageData.data[destIndex + 2] = imageData.data[sourceIndex + 2];
          warpedImageData.data[destIndex + 3] = imageData.data[sourceIndex + 3];
        }
      }
    }

    ctx.putImageData(warpedImageData, 0, 0);

    // drawControlPoints(ctx, controlPoints);

    if (drawChildren) ctx.restore();
    return this;
  },
});
