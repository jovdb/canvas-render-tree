import { addOperation } from ".";
import { IRenderItem, ItemDrawFn } from "../canvas";
import { OperationSchema } from "../schemas";

export interface IFillColorConfig {
  color: string;
}

const schema: OperationSchema<"fillColor"> = {
  name: "fillColor",
  description: "Fill the canvas with a solid color",
  getName: (config) => {
    const color = (config as IFillColorConfig)?.color;
    return color ? `fillColor: ${color}` : "fillColor";
  },
};

const create = (
  config: IFillColorConfig | undefined,
): IRenderItem<IFillColorConfig> => ({
  name: "fillColor",
  config: {
    color: "#fff",
    ...config,
  },
});

export const draw: ItemDrawFn<IFillColorConfig> = ({
  ctx,
  drawPrev,
  config,
}) => {
  // first draw previous items
  drawPrev?.(ctx);

  ctx.fillStyle = config.color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

const operation = {
  key: "fillColor",
  create,
  draw,
  schema,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    fillColor: typeof create;
  }
}
