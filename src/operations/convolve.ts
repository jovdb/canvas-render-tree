import { ChangeEvent, createElement } from "react";
import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig, ItemConfigFn } from "../configs";
import {
  boxBlurKernel,
  drawKernel,
  edgeDetectKernel,
  embossKernel,
  gaussianBlurKernel,
  normalizeKernel,
  sharpenKernel,
  sobelHKernel,
  sobelVKernel,
} from "../kernels";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";

/** Same kernel will be used for all color channels */
/*
function applyConvolutionKernelOnPixel(
  imageData: ImageData,
  x: number,
  y: number,
  kernel: number[][]
) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  const distance = Math.floor(kernel.length / 2);

  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      const nx = x + dx;
      const ny = y + dy;

      // Should we add the possibility to choose what to do at the image border? : None, Loop, Clamp, Black, White
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const weight = kernel[dy + distance][dx + distance];
        const neighborIndex = (ny * width + nx) * 4;

        r += data[neighborIndex] * weight;
        g += data[neighborIndex + 1] * weight;
        b += data[neighborIndex + 2] * weight;
        a += data[neighborIndex + 3] * weight;
      }
    }
  }

  return [
    Math.min(255, Math.max(0, 255 * r)),
    Math.min(255, Math.max(0, 255 * g)),
    Math.min(255, Math.max(0, 255 * b)),
    Math.min(255, Math.max(0, 255 * a)),
  ];
}
*/

function applyKernel(
  imageData: ImageData,
  kernel: number[][],
  /** Extra factor to multiply */
  multiply = 1,
) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const newImageData = new ImageData(width, height);
  const newData = newImageData.data;
  const radius = Math.floor(kernel.length / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = x + kx;
          const ny = y + ky;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const kernelValue = kernel[ky + radius][kx + radius] * multiply;
            const index = (ny * width + nx) * 4;
            r += data[index] * kernelValue;
            g += data[index + 1] * kernelValue;
            b += data[index + 2] * kernelValue;
            a += data[index + 3] * kernelValue;
          }
        }
      }
      const index = (y * width + x) * 4;
      newData[index] = r;
      newData[index + 1] = g;
      newData[index + 2] = b;
      newData[index + 3] = a;
    }
  }
  return newImageData;
}

export interface IConvolveConfig extends IConfig {
  /**
   * Convolution Kernel to use
   * https://docs.gimp.org/2.10/en/gimp-filter-convolution-matrix.html
   * https://setosa.io/ev/image-kernels
   */
  kernel: number[][];
  debugKernel?: boolean;
  normalize?: boolean;
  multiply?: number;
}

type KernelPreset =
  | "identity-3x3"
  | "identity-5x5"
  | "sharpen-3x3"
  | "box-blur-3x3"
  | "box-blur-5x5"
  | "box-blur-10x10"
  | "gaussian-3x3"
  | "gaussian-5x5"
  | "gaussian-10x10"
  | "edge-3x3"
  | "emboss-3x3"
  | "sobel-h-3x3"
  | "sobel-v-3x3"
  | "laplacian-3x3";

function createIdentityKernel(size: number) {
  const center = Math.floor(size / 2);
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => (x === center && y === center ? 1 : 0)),
  );
}

function getPresetKernel(preset: KernelPreset, size: number) {
  switch (preset) {
    case "identity-3x3":
      return createIdentityKernel(3);
    case "identity-5x5":
      return createIdentityKernel(5);
    case "sharpen-3x3":
      return sharpenKernel();
    case "box-blur-3x3":
      return boxBlurKernel(1);
    case "box-blur-5x5":
      return boxBlurKernel(2);
    case "box-blur-10x10":
      return boxBlurKernel(5);
    case "gaussian-3x3":
      return gaussianBlurKernel(1);
    case "gaussian-5x5":
      return gaussianBlurKernel(2);
    case "gaussian-10x10":
      return gaussianBlurKernel(5);
    case "edge-3x3":
      return edgeDetectKernel();
    case "emboss-3x3":
      return embossKernel();
    case "sobel-h-3x3":
      return sobelHKernel();
    case "sobel-v-3x3":
      return sobelVKernel();
    case "laplacian-3x3":
      return [
        [0, -1, 0],
        [-1, 4, -1],
        [0, -1, 0],
      ];
    default:
      return createIdentityKernel(size);
  }
}

function getPresetForKernel(kernel: number[][]): KernelPreset | undefined {
  const presets: Array<[KernelPreset, number[][]]> = [
    ["identity-3x3", createIdentityKernel(3)],
    ["identity-5x5", createIdentityKernel(5)],
    ["sharpen-3x3", sharpenKernel()],
    ["box-blur-3x3", boxBlurKernel(1)],
    ["box-blur-5x5", boxBlurKernel(2)],
    ["box-blur-10x10", boxBlurKernel(5)],
    ["gaussian-3x3", gaussianBlurKernel(1)],
    ["gaussian-5x5", gaussianBlurKernel(2)],
    ["gaussian-10x10", gaussianBlurKernel(5)],
    ["edge-3x3", edgeDetectKernel()],
    ["emboss-3x3", embossKernel()],
    ["sobel-h-3x3", sobelHKernel()],
    ["sobel-v-3x3", sobelVKernel()],
    ["laplacian-3x3", [
      [0, -1, 0],
      [-1, 4, -1],
      [0, -1, 0],
    ]],
  ];

  const kernelString = JSON.stringify(kernel);
  return presets.find(([, presetKernel]) => JSON.stringify(presetKernel) === kernelString)?.[0];
}

const schema: OperationSchema<"convolve"> = {
  name: "convolve",
  description: "Apply a convolution kernel on an image",
  getName: (config) =>
    config
      ? `convolve: kernel[${(config as IConvolveConfig).kernel.length}x${
          (config as IConvolveConfig).kernel[0].length
        }]`
      : "convolve",
  args: [
    {
      description: "Rendering to convolve",
      required: false,
    },
  ],
};

export const draw: ItemDrawFn<IConvolveConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
  // first draw previous items
  drawPrev?.(ctx);

  const drawInput = drawArgs?.[0];
  if (!drawInput) return;

  const {
    kernel,
    debugKernel = false,
    normalize = false,
    multiply = 1,
  } = config;

  function getBevelData() {
    // Create offscreen canvas to apply convolution
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = ctx.canvas.width;
    offscreenCanvas.height = ctx.canvas.height;
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!offscreenCtx)
      throw new Error("Failed to get 2D context for offscreen canvas");

    drawInput?.(offscreenCtx);

    const imageData = offscreenCtx.getImageData(
      0,
      0,
      offscreenCanvas.width,
      offscreenCanvas.height,
    );
    const newImageData = applyKernel(imageData, kernel, multiply);
    offscreenCtx.putImageData(newImageData, 0, 0);

    return offscreenCtx;
  }

  if (normalize) normalizeKernel(kernel);

  if (debugKernel) {
    drawKernel(ctx, kernel);
    return;
  }

  const offscreenCanvasCtx = getBevelData();
  ctx.drawImage(offscreenCanvasCtx.canvas, 0, 0); // Put the ImageData onto the canvas
};

export const ConvolveConfig: ItemConfigFn<IConvolveConfig> = ({
  config,
  mutateConfig,
}) => {
  const preset = getPresetForKernel(config.kernel);

  const updateKernel = (nextKernel: number[][]) => {
    mutateConfig((draftConfig) => {
      draftConfig.kernel = nextKernel;
    });
  };

  const handlePresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextPreset = event.target.value as KernelPreset;
    updateKernel(getPresetKernel(nextPreset, 3));
  };

  return createElement(
    "div",
    { style: { display: "grid", gap: "8px" } },
    createElement(
      "label",
      null,
      "Preset kernel: ",
      createElement(
        "select",
        {
          value: preset ?? "",
          onChange: handlePresetChange,
        },
        createElement("option", { value: "" }, ""),
        createElement("option", { value: "identity-3x3" }, "Identity (3x3)"),
        createElement("option", { value: "identity-5x5" }, "Identity (5x5)"),
        createElement("option", { value: "sharpen-3x3" }, "Sharpen (3x3)"),
        createElement("option", { value: "box-blur-3x3" }, "Box blur (3x3)"),
        createElement("option", { value: "box-blur-5x5" }, "Box blur (5x5)"),
        createElement("option", { value: "box-blur-10x10" }, "Box blur (10x10)"),
        createElement("option", { value: "gaussian-3x3" }, "Gaussian blur (3x3)"),
        createElement("option", { value: "gaussian-5x5" }, "Gaussian blur (5x5)"),
        createElement("option", { value: "gaussian-10x10" }, "Gaussian blur (10x10)"),
        createElement("option", { value: "edge-3x3" }, "Edge detection (3x3)"),
        createElement("option", { value: "emboss-3x3" }, "Emboss (3x3)"),
        createElement("option", { value: "sobel-h-3x3" }, "Sobel horizontal (3x3)"),
        createElement("option", { value: "sobel-v-3x3" }, "Sobel vertical (3x3)"),
        createElement("option", { value: "laplacian-3x3" }, "Laplacian (3x3)"),
      ),
    ),
  );
};

/** Apply a convolution kernel on an image */
export const create = (
  config: IConvolveConfig,
  input?: RenderTree,
): IRenderItem<IConvolveConfig> => ({
  name: "convolve",
  config,
  args: input ? [input] : undefined,
});

const operation = {
  key: "convolve",
  create,
  draw,
  schema,
  configComponent: ConvolveConfig,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    convolve: typeof create;
  }
}
