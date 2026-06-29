import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";

export interface ITransformConfig extends IConfig {
  translateX?: number;
  translateY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
}

const schema: OperationSchema<"transform"> = {
  name: "transform",
  description: "Apply geometric transformation (translate, scale) to input",
  getName: (config) =>
    config
      ? `transform: scale=${
          (config as ITransformConfig).scale ??
          (config as ITransformConfig).scaleX ??
          1
        }`
      : "transform",
  input: {
    required: true,
  },
  args: [],
};

export const create = (
  config: ITransformConfig,
  input: RenderTree,
): IRenderItem<ITransformConfig> => ({
  name: "transform",
  config,
  input,
});

export const draw: ItemDrawFn<ITransformConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  // first draw previous items
  drawPrev?.(ctx);

  const {
    translateX,
    translateY,
    scale,
    scaleX = scale,
    scaleY = scale,
  } = config;

  function apply() {
    // scale
    if (typeof scaleX === "number" || typeof scaleY === "number")
      ctx.scale(scaleX ?? 1, scaleY ?? 1);

    // translate
    if (typeof translateX === "number" || typeof translateY === "number")
      ctx.translate(translateX ?? 0, translateY ?? 0);
  }

  if (drawInput) ctx.save();
  apply();
  drawInput?.(ctx);
  if (drawInput) ctx.restore();
};

const operation = {
  key: "transform",
  create,
  draw,
  schema,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    transform: typeof create;
  }
}
