import { IRenderItem, RenderTree } from "../canvas";
import { ItemConfigFn } from "../configs";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";
import {
  clamp,
  drawRaisedEdge,
  getLightVector,
  IEdgeMaps,
  IRaisedEdgeConfig,
  raisedEdgeDefaults,
} from "./raised-edge";
import { CommonRaisedControls } from "./raised-edge-config";

export interface IRaiseKernelConfig extends IRaisedEdgeConfig {
  profile?: "linear" | "gaussian";
}

const schema: OperationSchema<"raise-kernel"> = {
  name: "raise-kernel",
  getName: (config) =>
    `raise kernel: ${(config as IRaiseKernelConfig | undefined)?.width ?? raisedEdgeDefaults.width}px`,
  description: "Raise transparent artwork using generated directional kernels",
  args: [{ description: "Rendered content to raise", required: true }],
};

function sampleAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const fx = x - x0;
  const fy = y - y0;
  const sample = (sampleX: number, sampleY: number) =>
    sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height
      ? 0
      : data[(sampleY * width + sampleX) * 4 + 3] / 255;
  const top = sample(x0, y0) * (1 - fx) + sample(x1, y0) * fx;
  const bottom = sample(x0, y1) * (1 - fx) + sample(x1, y1) * fx;
  return top * (1 - fy) + bottom * fy;
}

function getKernelWeight(
  step: number,
  width: number,
  profile: "linear" | "gaussian",
  softness: number,
) {
  if (profile === "linear") {
    return Math.max(0, 1 - (step - 1) / width);
  }
  const sigma = Math.max(0.5, width * (0.2 + softness * 0.8));
  return Math.exp(-(step * step) / (2 * sigma * sigma));
}

function processDirectionalKernel(
  imageData: ImageData,
  config: IRaiseKernelConfig,
): IEdgeMaps {
  const { width: canvasWidth, height, data } = imageData;
  const width = Math.max(
    1,
    Math.round(config.width ?? raisedEdgeDefaults.width),
  );
  const softness = config.softness ?? raisedEdgeDefaults.softness;
  const profile = config.profile ?? "gaussian";
  const light = getLightVector(config);
  const highlight = new Float32Array(canvasWidth * height);
  const shadow = new Float32Array(canvasWidth * height);
  const weights = new Float32Array(width);
  let totalWeight = 0;

  for (let step = 1; step <= width; step++) {
    const weight = getKernelWeight(step, width, profile, softness);
    weights[step - 1] = weight;
    totalWeight += weight;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const index = y * canvasWidth + x;
      const alpha = data[index * 4 + 3] / 255;
      if (alpha === 0) continue;

      let lightFacing = 0;
      let oppositeFacing = 0;
      for (let step = 1; step <= width; step++) {
        const distance = step;
        const weight = weights[step - 1];
        const towardLight = sampleAlpha(
          data,
          canvasWidth,
          height,
          x + light[0] * distance,
          y + light[1] * distance,
        );
        const awayFromLight = sampleAlpha(
          data,
          canvasWidth,
          height,
          x - light[0] * distance,
          y - light[1] * distance,
        );
        lightFacing += Math.max(0, alpha - towardLight) * weight;
        oppositeFacing += Math.max(0, alpha - awayFromLight) * weight;
      }

      highlight[index] = clamp(lightFacing / totalWeight, 0, 1);
      shadow[index] = clamp(oppositeFacing / totalWeight, 0, 1);
    }
  }

  return { highlight, shadow };
}

const draw = drawRaisedEdge<IRaiseKernelConfig>(processDirectionalKernel);

const create = (
  config: IRaiseKernelConfig = {},
  input: RenderTree | undefined,
): IRenderItem<IRaiseKernelConfig> => ({
  name: "raise-kernel",
  config,
  args: [input],
});

// eslint-disable-next-line react-refresh/only-export-components
const KernelConfig: ItemConfigFn<IRaiseKernelConfig> = (props) => {
  const { config, mutateConfig } = props;
  const profile = config.profile ?? "gaussian";
  return (
    <>
      <CommonRaisedControls {...props} />
      <label>
        Kernel profile
        <select
          value={profile}
          onChange={(event) => {
            const value = event.target.value as "linear" | "gaussian";
            mutateConfig((draftConfig) => {
              draftConfig.profile = value;
            });
          }}
        >
          <option value="linear">Linear</option>
          <option value="gaussian">Gaussian</option>
        </select>
      </label>
    </>
  );
};

const operation = {
  key: "raise-kernel",
  create,
  draw,
  schema,
  configComponent: KernelConfig,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    "raise-kernel": typeof create;
  }
}
