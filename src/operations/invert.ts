import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";

export interface IInvertConfig extends IConfig {}

const schema: OperationSchema<"invert"> = {
  name: "invert",
  description: "Invert the colors of the given rendering",
  args: [
    {
      description: "Rendering to invert",
      required: true,
    },
  ],
};

const create = (
  input: RenderTree | undefined,
): IRenderItem<IInvertConfig> => ({
  name: "invert",
  args: [input],
});

export const draw: ItemDrawFn<IInvertConfig> = ({
  ctx,
  drawPrev,
  drawArgs,
}) => {
  // first draw previous items
  drawPrev?.(ctx);

  function apply() {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Update pixel data
      data[i] = 255 - r;
      data[i + 1] = 255 - g;
      data[i + 2] = 255 - b;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const drawInput = drawArgs?.[0];

  if (drawInput) ctx.save();
  apply();
  drawInput?.(ctx);
  if (drawInput) ctx.restore();

  drawPrev?.(ctx);
};

const operation = {
  key: "invert",
  create,
  draw,
  schema,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    invert: typeof create;
  }
}
