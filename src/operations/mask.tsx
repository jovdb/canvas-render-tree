import { addOperation, IOperation } from ".";
import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig, ItemConfigFn } from "../configs";
import { OperationSchema } from "../schemas";
import { createOffscreenCanvasCtx, onChildCtx } from "./layer";

export type MaskSource = "red" | "green" | "blue" | "non-transparent";

export interface IMaskConfig extends IConfig {
  maskSource?: MaskSource;
}

const schema: OperationSchema<"mask"> = {
  name: "mask",
  getName: (config) =>
    config
      ? `mask: ${(config as IMaskConfig).maskSource ?? "non-transparent"}`
      : "mask",
  description: "Use the selected channel or alpha of the mask image as a mask",
  args: [
    {
      description: "Input image",
      required: true,
    },
    {
      description: "Mask image",
      required: true,
    },
  ],
};

const create = (
  config: IMaskConfig = {},
  input: RenderTree | undefined,
  mask: RenderTree | undefined,
): IRenderItem<IMaskConfig> => ({
  name: "mask",
  config: { maskSource: "non-transparent", ...config },
  args: [input, mask],
});

function getMaskAlpha(
  maskData: Uint8ClampedArray,
  maskSource: MaskSource,
  index: number,
) {
  switch (maskSource) {
    case "red":
      return maskData[index];
    case "green":
      return maskData[index + 1];
    case "blue":
      return maskData[index + 2];
    case "non-transparent":
    default:
      return maskData[index + 3];
  }
}

const draw: ItemDrawFn<IMaskConfig> = ({ ctx, drawPrev, config, drawArgs }) => {
  drawPrev?.(ctx);

  onChildCtx(ctx, !!drawPrev, (sourceCtx) => {
    const maskSource = config.maskSource ?? "non-transparent";

    drawArgs?.[0]?.(sourceCtx);

    const maskCtx = createOffscreenCanvasCtx(sourceCtx);
    drawArgs?.[1]?.(maskCtx);

    const sourceImageData = sourceCtx.getImageData(
      0,
      0,
      sourceCtx.canvas.width,
      sourceCtx.canvas.height,
    );
    const maskImageData = maskCtx.getImageData(
      0,
      0,
      sourceCtx.canvas.width,
      sourceCtx.canvas.height,
    );

    const output = new ImageData(sourceImageData.width, sourceImageData.height);
    output.data.set(sourceImageData.data);

    const sourceData = sourceImageData.data;
    const maskData = maskImageData.data;
    const outputData = output.data;

    for (let index = 0; index < sourceData.length; index += 4) {
      const sourceAlpha = sourceData[index + 3];
      const maskAlpha = getMaskAlpha(maskData, maskSource, index);
      outputData[index + 3] = Math.round((sourceAlpha * maskAlpha) / 255);
    }

    sourceCtx.putImageData(output, 0, 0);
  });
};

const maskSources: MaskSource[] = ["red", "green", "blue", "non-transparent"];

export const MaskConfig: ItemConfigFn<IMaskConfig> = ({
  config,
  mutateConfig,
}) => {
  return (
    <div>
      Mask source:{" "}
      <select
        value={config.maskSource ?? "non-transparent"}
        onChange={(e) => {
          const newValue = e.target.value as MaskSource;
          mutateConfig((draftConfig) => {
            draftConfig.maskSource = newValue;
          });
        }}
      >
        {maskSources.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>
    </div>
  );
};

const operation: IOperation<"mask", IMaskConfig> = {
  key: "mask",
  create,
  draw,
  schema,
  configComponent: MaskConfig,
} as const;

addOperation(operation);

declare global {
  interface IOperations {
    [operation.key]: typeof create;
  }
}
