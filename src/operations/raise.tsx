import { addOperation } from ".";
import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig, ItemConfigFn } from "../configs";
import { OperationSchema } from "../schemas";

export interface IRaiseConfig extends IConfig {
  lightX?: number;
  lightY?: number;
  lightZ?: number;
  strength?: number;
  ambient?: number;
  diffuse?: number;
  specular?: number;
  shininess?: number;
  highlightColor?: [number, number, number, number];
  shadowColor?: [number, number, number, number];
}

const schema: OperationSchema<"raise"> = {
  name: "raise",
  getName: (config) =>
    config ? `raise: ${(config as IRaiseConfig).strength ?? 1}` : "raise",
  description: "Create a raised image effect from transparent shapes",
  args: [
    {
      description: "Rendering to raise",
      required: false,
    },
  ],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalize(x: number, y: number, z: number) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length] as const;
}

function getDistanceField(imageData: ImageData) {
  const { width, height, data } = imageData;
  const size = width * height;
  const distance = new Float32Array(size);
  const maxDistance = width + height;

  for (let i = 0; i < size; i++) {
    distance[i] = data[i * 4 + 3] > 0 ? maxDistance : 0;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (data[index * 4 + 3] === 0) continue;

      const best = Math.min(
        x > 0 ? distance[index - 1] + 1 : maxDistance,
        y > 0 ? distance[index - width] + 1 : maxDistance,
        x > 0 && y > 0 ? distance[index - width - 1] + 1.414 : maxDistance,
        x < width - 1 && y > 0 ? distance[index - width + 1] + 1.414 : maxDistance,
      );

      distance[index] = best;
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const index = y * width + x;
      if (data[index * 4 + 3] === 0) continue;

      const best = Math.min(
        distance[index],
        x < width - 1 ? distance[index + 1] + 1 : maxDistance,
        y < height - 1 ? distance[index + width] + 1 : maxDistance,
        x < width - 1 && y < height - 1 ? distance[index + width + 1] + 1.414 : maxDistance,
        x > 0 && y < height - 1 ? distance[index + width - 1] + 1.414 : maxDistance,
      );

      distance[index] = best;
    }
  }

  return distance;
}

function applyRaiseEffect(imageData: ImageData, config: IRaiseConfig) {
  const {
    lightX = -0.7,
    lightY = -0.7,
    lightZ = 0.5,
    strength = 1,
    ambient = 0.25,
    diffuse = 0.7,
    specular = 0.35,
    shininess = 16,
    shadowColor = [0, 0, 0, 255],
  } = config;

  const width = imageData.width;
  const height = imageData.height;
  const input = imageData.data;
  const output = new ImageData(width, height);
  const distance = getDistanceField(imageData);

  const light = normalize(lightX, lightY, lightZ);
  const view = [0, 0, 1] as const;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const pixelIndex = index * 4;
      const alpha = input[pixelIndex + 3];
      const baseR = input[pixelIndex];
      const baseG = input[pixelIndex + 1];
      const baseB = input[pixelIndex + 2];

      output.data[pixelIndex] = baseR;
      output.data[pixelIndex + 1] = baseG;
      output.data[pixelIndex + 2] = baseB;
      output.data[pixelIndex + 3] = alpha;

      if (alpha === 0) continue;

      const sample = (px: number, py: number) => {
        if (px < 0 || px >= width || py < 0 || py >= height) return 0;
        const sampleIndex = py * width + px;
        return distance[sampleIndex];
      };

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

      const magnitude = Math.hypot(gx, gy) || 1;
      const normal = normalize(-gx / magnitude, -gy / magnitude, 1);
      const ndotl = clamp(
        normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2],
        0,
        1,
      );

      const reflected = normalize(
        2 * ndotl * normal[0] - light[0],
        2 * ndotl * normal[1] - light[1],
        2 * ndotl * normal[2] - light[2],
      );
      const spec = clamp(
        reflected[0] * view[0] + reflected[1] * view[1] + reflected[2] * view[2],
        0,
        1,
      );

      const shading =
        ambient + diffuse * ndotl + specular * Math.pow(spec, shininess);
      const intensity = clamp(0.4 + strength * shading * 0.6, 0.1, 1.3);
      const highlightAmount = clamp(spec * specular * strength, 0, 1);
      const shadowAmount = clamp((1 - ndotl) * (0.25 * strength), 0, 1);

      const applyChannel = (value: number, tint: number, shadow: number) =>
        clamp(Math.round(value * tint - shadow), 0, 255);

      output.data[pixelIndex] = applyChannel(
        baseR,
        intensity,
        shadowAmount * shadowColor[0] * 0.01,
      );
      output.data[pixelIndex + 1] = applyChannel(
        baseG,
        intensity,
        shadowAmount * shadowColor[1] * 0.01,
      );
      output.data[pixelIndex + 2] = applyChannel(
        baseB,
        intensity + highlightAmount * 0.15,
        shadowAmount * shadowColor[2] * 0.01,
      );
      output.data[pixelIndex + 3] = alpha;
    }
  }

  return output;
}

const create = (config: IRaiseConfig = {}, input?: RenderTree): IRenderItem<IRaiseConfig> => ({
  name: "raise",
  config,
  args: input ? [input] : undefined,
});

export const draw: ItemDrawFn<IRaiseConfig> = ({ ctx, drawPrev, config, drawArgs }) => {
  drawPrev?.(ctx);

  const drawInput = drawArgs?.[0];
  if (drawInput) {
    drawInput(ctx);
  }

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const raised = applyRaiseEffect(imageData, config);
  ctx.putImageData(raised, 0, 0);
};

export const RaiseConfig: ItemConfigFn<IRaiseConfig> = ({
  config,
  mutateConfig,
}) => {
  const {
    lightX = -0.7,
    lightY = -0.7,
    lightZ = 0.5,
    strength = 1,
    ambient = 0.25,
    specular = 0.35,
    shininess = 16,
  } = config;

  const updateNumber = (key: keyof IRaiseConfig, value: number) => {
    mutateConfig((draftConfig) => {
      (draftConfig as Record<string, number>)[key] = value;
    });
  };

  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label>
        Strength: {strength.toFixed(2)}
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.01"
          value={strength}
          onChange={(e) => updateNumber("strength", parseFloat(e.target.value))}
        />
      </label>
      <label>
        Light X: {lightX.toFixed(2)}
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={lightX}
          onChange={(e) => updateNumber("lightX", parseFloat(e.target.value))}
        />
      </label>
      <label>
        Light Y: {lightY.toFixed(2)}
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={lightY}
          onChange={(e) => updateNumber("lightY", parseFloat(e.target.value))}
        />
      </label>
      <label>
        Light Z: {lightZ.toFixed(2)}
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.01"
          value={lightZ}
          onChange={(e) => updateNumber("lightZ", parseFloat(e.target.value))}
        />
      </label>
      <label>
        Ambient: {ambient.toFixed(2)}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={ambient}
          onChange={(e) => updateNumber("ambient", parseFloat(e.target.value))}
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
          onChange={(e) => updateNumber("specular", parseFloat(e.target.value))}
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
          onChange={(e) => updateNumber("shininess", parseFloat(e.target.value))}
        />
      </label>
      <small>Uses the alpha channel to build a distance field and shade the surface.</small>
    </div>
  );
};

const operation = {
  key: "raise",
  create,
  draw,
  schema,
  configComponent: RaiseConfig,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    raise: typeof create;
  }
}
