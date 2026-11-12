import { IRenderItem, RenderTree } from "../canvas";
import { ItemConfigFn } from "../configs";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";
import {
  clamp,
  createRaisedEdgeDistance,
  drawRaisedEdge,
  getDistanceNormal,
  getLightVector,
  getRaisedEdgeFalloff,
  IEdgeMaps,
  IRaisedEdgeConfig,
  raisedEdgeDefaults,
} from "./raised-edge";
import { CommonRaisedControls } from "./raised-edge-config";

export interface IRaiseMorphologyConfig extends IRaisedEdgeConfig {
  shape?: "disk" | "square" | "diamond";
}

const schema: OperationSchema<"raise-morphology"> = {
  name: "raise-morphology",
  getName: (config) =>
    `raise morphology: ${(config as IRaiseMorphologyConfig | undefined)?.width ?? raisedEdgeDefaults.width}px`,
  description: "Raise transparent artwork using alpha-mask morphology",
  args: [{ description: "Rendered content to raise", required: true }],
};

function processMorphology(
  imageData: ImageData,
  config: IRaiseMorphologyConfig,
): IEdgeMaps {
  const { width, height, data } = imageData;
  const shape = config.shape ?? "disk";
  const metric =
    shape === "square"
      ? "square"
      : shape === "diamond"
        ? "diamond"
        : "euclidean";
  const bevelWidth = config.width ?? raisedEdgeDefaults.width;
  const softness = config.softness ?? raisedEdgeDefaults.softness;
  const light = getLightVector(config);
  const distance = createRaisedEdgeDistance(imageData, metric);
  const highlight = new Float32Array(width * height);
  const shadow = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (data[index * 4 + 3] === 0 || distance[index] > bevelWidth + 1) {
        continue;
      }

      const falloff = getRaisedEdgeFalloff(
        distance[index],
        bevelWidth,
        softness,
      );
      const normal = getDistanceNormal(distance, width, height, x, y);
      const ndotl = clamp(
        normal[0] * light[0] +
          normal[1] * light[1] +
          normal[2] * light[2],
        -1,
        1,
      );
      highlight[index] = falloff * clamp(0.2 + 0.8 * Math.max(0, ndotl), 0, 1);
      shadow[index] =
        falloff *
        clamp(0.8 * Math.max(0, -ndotl) + Math.max(0, 0.15 - ndotl), 0, 1);
    }
  }

  return { highlight, shadow };
}

const draw = drawRaisedEdge<IRaiseMorphologyConfig>(processMorphology);

const create = (
  config: IRaiseMorphologyConfig = {},
  input: RenderTree | undefined,
): IRenderItem<IRaiseMorphologyConfig> => ({
  name: "raise-morphology",
  config,
  args: [input],
});

// eslint-disable-next-line react-refresh/only-export-components
const MorphologyConfig: ItemConfigFn<IRaiseMorphologyConfig> = (props) => {
  const { config, mutateConfig } = props;
  const shape = config.shape ?? "disk";
  return (
    <>
      <CommonRaisedControls {...props} />
      <label>
        Neighborhood shape
        <select
          value={shape}
          onChange={(event) => {
            const value = event.target.value as "disk" | "square" | "diamond";
            mutateConfig((draftConfig) => {
              draftConfig.shape = value;
            });
          }}
        >
          <option value="disk">Disk</option>
          <option value="square">Square</option>
          <option value="diamond">Diamond</option>
        </select>
      </label>
    </>
  );
};

const operation = {
  key: "raise-morphology",
  create,
  draw,
  schema,
  configComponent: MorphologyConfig,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    "raise-morphology": typeof create;
  }
}
