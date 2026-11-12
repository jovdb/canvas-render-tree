import { ItemDrawFn } from "../canvas";
import { IConfig } from "../configs";
import { onChildCtx } from "./layer";

export interface IRaisedEdgeConfig extends IConfig {
  width?: number;
  strength?: number;
  lightAngle?: number;
  lightElevation?: number;
  softness?: number;
  highlightColor?: string;
  highlightOpacity?: number;
  shadowColor?: string;
  shadowOpacity?: number;
}

export interface IEdgeMaps {
  highlight: Float32Array;
  shadow: Float32Array;
}

export const raisedEdgeDefaults = {
  width: 6,
  strength: 1,
  lightAngle: 225,
  lightElevation: 35,
  softness: 0.5,
  highlightColor: "#ffffff",
  highlightOpacity: 0.75,
  shadowColor: "#000000",
  shadowOpacity: 0.75,
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(value: number) {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function getRaisedEdgeFalloff(
  distance: number,
  width: number,
  softness: number,
) {
  const linear = clamp(1 - (distance - 1) / width, 0, 1);
  return linear * (1 - softness) + smoothstep(linear) * softness;
}

export function getLightVector(config: IRaisedEdgeConfig) {
  const angle = ((config.lightAngle ?? raisedEdgeDefaults.lightAngle) * Math.PI) / 180;
  const elevation =
    ((config.lightElevation ?? raisedEdgeDefaults.lightElevation) * Math.PI) / 180;
  const horizontal = Math.cos(elevation);
  return [
    Math.cos(angle) * horizontal,
    Math.sin(angle) * horizontal,
    Math.sin(elevation),
  ] as const;
}

function parseColor(color: string) {
  const hex = color.startsWith("#") ? color.slice(1) : color;
  const expanded =
    hex.length === 3
      ? [...hex].map((value) => `${value}${value}`).join("")
      : hex;
  if (!/^[\da-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Invalid raised-edge color: '${color}'`);
  }
  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ] as const;
}

function blendChannel(source: number, tint: number, amount: number) {
  return Math.round(source * (1 - amount) + tint * amount);
}

export function applyEdgeMaps(
  imageData: ImageData,
  maps: IEdgeMaps,
  config: IRaisedEdgeConfig,
) {
  const output = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
  );
  const strength = config.strength ?? raisedEdgeDefaults.strength;
  const highlightOpacity =
    config.highlightOpacity ?? raisedEdgeDefaults.highlightOpacity;
  const shadowOpacity = config.shadowOpacity ?? raisedEdgeDefaults.shadowOpacity;
  const [highlightR, highlightG, highlightB] = parseColor(
    config.highlightColor ?? raisedEdgeDefaults.highlightColor,
  );
  const [shadowR, shadowG, shadowB] = parseColor(
    config.shadowColor ?? raisedEdgeDefaults.shadowColor,
  );

  for (let index = 0; index < imageData.width * imageData.height; index++) {
    const pixelIndex = index * 4;
    if (imageData.data[pixelIndex + 3] === 0) continue;

    const shadowAmount = clamp(
      maps.shadow[index] * strength * shadowOpacity,
      0,
      1,
    );
    const highlightAmount = clamp(
      maps.highlight[index] * strength * highlightOpacity,
      0,
      1,
    );
    const sourceR = imageData.data[pixelIndex];
    const sourceG = imageData.data[pixelIndex + 1];
    const sourceB = imageData.data[pixelIndex + 2];
    const shadowedR = blendChannel(sourceR, shadowR, shadowAmount);
    const shadowedG = blendChannel(sourceG, shadowG, shadowAmount);
    const shadowedB = blendChannel(sourceB, shadowB, shadowAmount);

    output.data[pixelIndex] = blendChannel(
      shadowedR,
      highlightR,
      highlightAmount,
    );
    output.data[pixelIndex + 1] = blendChannel(
      shadowedG,
      highlightG,
      highlightAmount,
    );
    output.data[pixelIndex + 2] = blendChannel(
      shadowedB,
      highlightB,
      highlightAmount,
    );
  }

  return output;
}

export function drawRaisedEdge<TConfig extends IRaisedEdgeConfig>(
  process: (imageData: ImageData, config: TConfig) => IEdgeMaps,
): ItemDrawFn<TConfig> {
  return ({ ctx, drawPrev, config, drawArgs }) => {
    drawPrev?.(ctx);
    onChildCtx(ctx, !!drawPrev, (drawCtx) => {
      drawArgs?.[0]?.(drawCtx);
      const imageData = drawCtx.getImageData(
        0,
        0,
        drawCtx.canvas.width,
        drawCtx.canvas.height,
      );
      drawCtx.putImageData(
        applyEdgeMaps(imageData, process(imageData, config), config),
        0,
        0,
      );
    });
  };
}

export function createRaisedEdgeDistance(
  imageData: ImageData,
  metric: "euclidean" | "square" | "diamond" = "euclidean",
) {
  const { width, height, data } = imageData;
  const paddedWidth = width + 2;
  const paddedHeight = height + 2;
  const infinity = 1e20;
  const values = new Float64Array(paddedWidth * paddedHeight);

  for (let y = 0; y < paddedHeight; y++) {
    for (let x = 0; x < paddedWidth; x++) {
      const isBorder = x === 0 || y === 0 || x === paddedWidth - 1 || y === paddedHeight - 1;
      const isTransparent =
        !isBorder && data[((y - 1) * width + (x - 1)) * 4 + 3] === 0;
      values[y * paddedWidth + x] = isBorder || isTransparent ? 0 : infinity;
    }
  }

  if (metric === "euclidean") {
    const rowValues = new Float64Array(paddedWidth);
    for (let y = 0; y < paddedHeight; y++) {
      const rowOffset = y * paddedWidth;
      for (let x = 0; x < paddedWidth; x++) {
        rowValues[x] = values[rowOffset + x];
      }
      distanceTransform1d(rowValues);
      for (let x = 0; x < paddedWidth; x++) {
        values[rowOffset + x] = rowValues[x];
      }
    }

    const columnValues = new Float64Array(paddedHeight);
    for (let x = 0; x < paddedWidth; x++) {
      for (let y = 0; y < paddedHeight; y++) {
        columnValues[y] = values[y * paddedWidth + x];
      }
      distanceTransform1d(columnValues);
      for (let y = 0; y < paddedHeight; y++) {
        values[y * paddedWidth + x] = columnValues[y];
      }
    }
  } else {
    const squareOffsets = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
    ];
    const diamondOffsets = [
      [0, -1],
      [-1, 0],
    ];
    const offsets = metric === "square" ? squareOffsets : diamondOffsets;

    for (let y = 1; y < paddedHeight - 1; y++) {
      for (let x = 1; x < paddedWidth - 1; x++) {
        const index = y * paddedWidth + x;
        if (values[index] === 0) continue;
        for (const [dx, dy] of offsets) {
          values[index] = Math.min(
            values[index],
            values[(y + dy) * paddedWidth + x + dx] + 1,
          );
        }
      }
    }

    const reverseOffsets =
      metric === "square"
        ? [
            [1, 1],
            [0, 1],
            [-1, 1],
            [1, 0],
          ]
        : [
            [0, 1],
            [1, 0],
          ];
    for (let y = paddedHeight - 2; y >= 1; y--) {
      for (let x = paddedWidth - 2; x >= 1; x--) {
        const index = y * paddedWidth + x;
        if (values[index] === 0) continue;
        for (const [dx, dy] of reverseOffsets) {
          values[index] = Math.min(
            values[index],
            values[(y + dy) * paddedWidth + x + dx] + 1,
          );
        }
      }
    }
  }

  const distance = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const squaredDistance = values[(y + 1) * paddedWidth + x + 1];
      distance[y * width + x] =
        data[(y * width + x) * 4 + 3] === 0
          ? 0
          : metric === "euclidean"
            ? Math.sqrt(squaredDistance)
            : squaredDistance;
    }
  }

  return distance;
}

function distanceTransform1d(values: Float64Array) {
  const length = values.length;
  const vertices = new Int32Array(length);
  const boundaries = new Float64Array(length + 1);
  let k = 0;
  vertices[0] = 0;
  boundaries[0] = -Infinity;
  boundaries[1] = Infinity;

  for (let q = 1; q < length; q++) {
    let intersection =
      (values[q] + q * q -
        (values[vertices[k]] + vertices[k] * vertices[k])) /
      (2 * q - 2 * vertices[k]);
    while (intersection <= boundaries[k]) {
      k--;
      intersection =
        (values[q] + q * q -
          (values[vertices[k]] + vertices[k] * vertices[k])) /
        (2 * q - 2 * vertices[k]);
    }
    k++;
    vertices[k] = q;
    boundaries[k] = intersection;
    boundaries[k + 1] = Infinity;
  }

  k = 0;
  for (let q = 0; q < length; q++) {
    while (boundaries[k + 1] < q) k++;
    const delta = q - vertices[k];
    values[q] = delta * delta + values[vertices[k]];
  }
}

export function getDistanceNormal(
  distance: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const sample = (sampleX: number, sampleY: number) =>
    sampleX < 0 ||
    sampleX >= width ||
    sampleY < 0 ||
    sampleY >= height
      ? 0
      : distance[sampleY * width + sampleX];
  const gx =
    -sample(x - 1, y - 1) -
    2 * sample(x - 1, y) -
    sample(x - 1, y + 1) +
    sample(x + 1, y - 1) +
    2 * sample(x + 1, y) +
    sample(x + 1, y + 1);
  const gy =
    -sample(x - 1, y - 1) -
    2 * sample(x, y - 1) -
    sample(x + 1, y - 1) +
    sample(x - 1, y + 1) +
    2 * sample(x, y + 1) +
    sample(x + 1, y + 1);
  const length = Math.hypot(gx, gy) || 1;
  const normalX = -gx / length;
  const normalY = -gy / length;
  const z = 0.65;
  const normalLength = Math.hypot(normalX, normalY, z);
  return [
    normalX / normalLength,
    normalY / normalLength,
    z / normalLength,
  ] as const;
}
