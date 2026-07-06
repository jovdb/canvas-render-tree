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
  description:
    "Apply geometric transformation (translate, scale) to the given rendering",
  getName: (config) => {
    const cfg = config as ITransformConfig;
    let details = "";
    if (cfg.scale || cfg.scaleX || cfg.scaleY) {
      if (cfg.scaleX || cfg.scaleY) {
        details += `scale(${cfg.scaleX ?? 1}, ${cfg.scaleY ?? 1})`;
      } else {
        details += `scale(${cfg.scale ?? 1})`;
      }
    }
    if (cfg.translateX || cfg.translateY) {
      if (details) details += ", ";
      details += `translate(${cfg.translateX ?? 0}, ${cfg.translateY ?? 0})`;
    }

    if (details) return `transform: ${details}`;
    return "transform";
  },
  args: [
    {
      description: "Rendering to transform",
      required: true,
    },
  ],
};

export const create = (
  config: ITransformConfig,
  input: RenderTree | undefined,
): IRenderItem<ITransformConfig> => ({
  name: "transform",
  config,
  args: [input],
});

export const draw: ItemDrawFn<ITransformConfig> = ({
  ctx,
  drawPrev,
  config,
  drawArgs,
}) => {
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

  const drawInput = drawArgs?.[0];

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
