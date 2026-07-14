import { getContext2d, IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";

export function createOffscreenCanvasCtx(sourceCtx: CanvasRenderingContext2D) {
  // Create an offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = sourceCtx.canvas.width;
  canvas.height = sourceCtx.canvas.height;
  const childCtx = getContext2d(canvas, "layerCtx");
  if (!childCtx) {
    throw new Error("Failed to create offscreen canvas context");
  }
  return childCtx;
}

/** optionally draw via temporary offscreen canvas */
export function onChildCtx(
  sourceCtx: CanvasRenderingContext2D,
  useChild: boolean,
  draw: (childCtx: CanvasRenderingContext2D) => void,
) {
  if (useChild) {
    sourceCtx.save();
    const childCtx = createOffscreenCanvasCtx(sourceCtx);
    draw(childCtx);
    sourceCtx.drawImage(
      childCtx.canvas,
      0,
      0,
      sourceCtx.canvas.width,
      sourceCtx.canvas.height,
    );
    sourceCtx.restore();
  } else {
    sourceCtx.save();
    draw(sourceCtx);
    sourceCtx.restore();
  }
}

export interface ILayerConfig extends IConfig {}

const schema: OperationSchema<"layer"> = {
  name: "layer",
  description: "Group children on a new render layer",
  args: [
    {
      description: "The rendering to draw on the new layer",
      required: true,
    },
  ],
};

export const draw: ItemDrawFn = ({ ctx, drawPrev, drawArgs }) => {
  // first draw previous items
  drawPrev?.(ctx);

  // Create an offscreen canvas
  const childCtx = createOffscreenCanvasCtx(ctx);

  const drawInput = drawArgs?.[0];

  // Draw children on the offscreen canvas
  drawInput?.(childCtx);

  // Draw new children context on the parent context
  ctx.drawImage(childCtx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
};

/** Draw children on a new render layer */
const create = (input: RenderTree | undefined): IRenderItem<ILayerConfig> => ({
  name: "layer",
  args: [input],
});

const operation = {
  key: "layer",
  create,
  draw,
  schema,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    layer: typeof create;
  }
}
