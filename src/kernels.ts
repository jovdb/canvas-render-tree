// https://en.wikipedia.org/wiki/Kernel_(image_processing)

export function sharpenKernel() {
  return [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ];
}

export function boxBlurKernel(radius = 1) {
  // Kernel size is determined by the radius
  const size = radius * 2 + 1;
  const value = 1 / size ** 2;

  return new Array(size).fill(value).map(() => new Array(size).fill(value));
}

export function guassianBlurKernel(
  radius = 1,
  /**
   * Standard deviation (sigma) for Gaussian distribution
   * Default = radius / 3
   */
  sigma = radius / 3.0,
  /** value between -1 and 1 */
  offsetXFactor = 0,
  /** value between -1 and 1 */
  offsetYFactor = offsetXFactor
) {
  const size = 2 * radius + 1;
  const kernel = Array.from({ length: size }, () => Array(size).fill(0));

  const centerX = radius + offsetXFactor * radius;
  const centerY = radius + offsetYFactor * radius;

  // Fill the kernel with Gaussian values
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = i - centerX;
      const y = j - centerY;
      kernel[i][j] =
        (1 / (2 * Math.PI * sigma * sigma)) *
        Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
    }
  }

  // Normalize the kernel so that the sum of all elements equals 1
  const sum = kernel.flat().reduce((acc, val) => acc + val, 0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      kernel[i][j] /= sum;
    }
  }

  return kernel;
}

/** Highlight edges */
export function edgeDetectKernel() {
  return [
    [-1, -1, -1],
    [-1, 9, -1],
    [-1, -1, -1],
  ];
}

/** Create 3D embossed effect */
export function embossKernel() {
  return [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
  ];
}

/** Horizontal Edge detection */
export function sobelHKernel() {
  return [
    [-1 / 8, 0, 1 / 8],
    [-2 / 8, 0, 2 / 8],
    [-1 / 8, 0, 1 / 8],
  ];
}

/** Vertical Edge detection */
export function sobelVKernel() {
  return [
    [-1 / 8, -2 / 8, -1 / 8],
    [0, 0, 0],
    [1 / 8, 2 / 8, 1 / 8],
  ];
}

/** Detect edges (second derivative) */
export function laplacianKernel() {
  return [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0],
  ];
}

export const kernels = {
  boxBlurKernel,
  guassianBlurKernel,
  edgeDetectKernel,
  embossKernel,
  sharpenKernel,
  sobelHKernel,
  sobelVKernel,
  laplacianKernel,
};

export function drawKernel(ctx: CanvasRenderingContext2D, kernel: number[][]) {
  const { width, height } = ctx.canvas;

  let min = 0;
  let max = 0;
  for (let y = 0; y < kernel.length; y++) {
    const row = kernel[y];
    for (let x = 0; x < row.length; x++) {
      const value = row[x];
      if (min > value) min = value;
      if (max < value) max = value;
    }
  }

  for (let y = 0; y < kernel.length; y++) {
    const row = kernel[y];
    const h = height / kernel.length;
    for (let x = 0; x < row.length; x++) {
      const w = width / row.length;
      const value = row[x];

      const fontSize = h / 4;
      ctx.font = `${fontSize}px 'Arial'`;

      let r = 0;
      let g = 0;
      let b = 0;

      /*
      if (value >= 0 && value <= 1) {
        const minInOne = Math.max(0, min);
        const maxInOne = Math.min(1, max);
        const colorScale = min / Math.max(1, max);
        r = Math.round(
          value + (min > 0 ? -min : 0) + Math.min(0, min) * colorScale * 255
        );
        g = r;
        b = r;
      } else if (value < 0) {
        const colorScale = 1 / min;

        r = Math.round(value * colorScale * 255);
      } else {
        const colorScale = max - 1;
        g = Math.round((value - 1) * colorScale * 255);
      }
      */

      r = g = b = Math.round(((value - min) / (max - min)) * 255);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      ctx.fillRect(x * w, y * h, (x + 1) * w, (y + 1) * h);
      ctx.strokeStyle = '#444';
      ctx.strokeRect(x * w, y * h, (x + 1) * w, (y + 1) * h);

      ctx.fillStyle = r + b + g > 128 * 3 ? '#444' : '#BBB';
      const textMetrics = ctx.measureText(value.toFixed(2).toString());
      ctx.fillText(
        value.toFixed(2).toString(),
        x * w + (w - textMetrics.width) / 2,
        y * h + (h - fontSize) / 2 + fontSize
      );
    }
  }
}

export function normalizeKernel(kernel: number[][]) {
  let sum = 0;
  for (let y = 0; y < kernel.length; y++) {
    const row = kernel[y];
    for (let x = 0; x < row.length; x++) {
      const value = row[x];
      sum += value;
    }
  }
  for (let y = 0; y < kernel.length; y++) {
    const row = kernel[y];
    for (let x = 0; x < row.length; x++) {
      row[x] /= sum;
    }
  }
}
