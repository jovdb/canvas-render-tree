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

export interface IRaiseDistanceConfig extends IRaisedEdgeConfig {
  ambient?: number;
  diffuse?: number;
  specular?: number;
  shininess?: number;
}

const schema: OperationSchema<"raise-distance"> = {
  name: "raise-distance",
  getName: (config) =>
    `raise distance: ${(config as IRaiseDistanceConfig | undefined)?.width ?? raisedEdgeDefaults.width}px`,
  description: "Raise transparent artwork using exact distance-field lighting",
  args: [{ description: "Rendered content to raise", required: true }],
};

function processDistanceField(
  imageData: ImageData,
  config: IRaiseDistanceConfig,
): IEdgeMaps {
  const { width, height, data } = imageData;
  const bevelWidth = config.width ?? raisedEdgeDefaults.width;
  const softness = config.softness ?? raisedEdgeDefaults.softness;
  const ambient = config.ambient ?? 0.25;
  const diffuse = config.diffuse ?? 0.7;
  const specular = config.specular ?? 0.35;
  const shininess = config.shininess ?? 16;
  const distance = createRaisedEdgeDistance(imageData);
  const light = getLightVector(config);
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
      const halfVectorLength = Math.hypot(
        light[0],
        light[1],
        light[2] + 1,
      );
      const specularDot = Math.max(
        0,
        (normal[0] * light[0] +
          normal[1] * light[1] +
          normal[2] * (light[2] + 1)) /
          halfVectorLength,
      );
      const specularAmount = Math.pow(specularDot, shininess) * specular;

      highlight[index] =
        falloff *
        clamp(ambient + diffuse * Math.max(0, ndotl) + specularAmount, 0, 1);
      shadow[index] =
        falloff *
        clamp(
          diffuse * Math.max(0, -ndotl) +
            (1 - ambient) * Math.max(0, 0.2 - ndotl) * 0.5,
          0,
          1,
        );
    }
  }

  return { highlight, shadow };
}

const draw = drawRaisedEdge<IRaiseDistanceConfig>(processDistanceField);

const create = (
  config: IRaiseDistanceConfig = {},
  input: RenderTree | undefined,
): IRenderItem<IRaiseDistanceConfig> => ({
  name: "raise-distance",
  config,
  args: [input],
});

// eslint-disable-next-line react-refresh/only-export-components
const DistanceConfig: ItemConfigFn<IRaiseDistanceConfig> = (props) => {
  const {
    config,
    mutateConfig,
  } = props;
  const ambient = config.ambient ?? 0.25;
  const diffuse = config.diffuse ?? 0.7;
  const specular = config.specular ?? 0.35;
  const shininess = config.shininess ?? 16;
  const update = (
    key: "ambient" | "diffuse" | "specular" | "shininess",
    value: number,
  ) => {
    mutateConfig((draftConfig) => {
      draftConfig[key] = value;
    });
  };

  return (
    <>
      <CommonRaisedControls {...props} />
      <fieldset style={{ display: "grid", gap: "6px" }}>
        <legend>Distance-field lighting</legend>
        <label>
          Ambient: {ambient.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ambient}
            onChange={(event) => update("ambient", parseFloat(event.target.value))}
          />
        </label>
        <label>
          Diffuse: {diffuse.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={diffuse}
            onChange={(event) => update("diffuse", parseFloat(event.target.value))}
          />
        </label>
        <label>
          Specular: {specular.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={specular}
            onChange={(event) =>
              update("specular", parseFloat(event.target.value))
            }
          />
        </label>
        <label>
          Shininess: {shininess}
          <input
            type="range"
            min="1"
            max="64"
            step="1"
            value={shininess}
            onChange={(event) =>
              update("shininess", parseFloat(event.target.value))
            }
          />
        </label>
      </fieldset>
    </>
  );
};

const operation = {
  key: "raise-distance",
  create,
  draw,
  schema,
  configComponent: DistanceConfig,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    "raise-distance": typeof create;
  }
}
