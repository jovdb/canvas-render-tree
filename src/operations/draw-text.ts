import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";

export interface IDrawTextConfig extends IConfig {
  text: string;
  x?: number;
  y?: number;
  foregroundColor?: string;
  fontSize?: number;
  fontFamilyName?: string;
  isBold?: boolean;
  isItalic?: boolean;
}

const schema: OperationSchema<"drawText"> = {
  name: "drawText",
  description: "Draw text on the canvas",
  getName: (config) =>
    config
      ? `drawText: "${
          ((config as IDrawTextConfig).text || "").length > 10
            ? ((config as IDrawTextConfig).text || "").substring(0, 10) + "..."
            : (config as IDrawTextConfig).text || ""
        }"`
      : "drawText",
};

export const draw: ItemDrawFn<IDrawTextConfig> = (ctx, drawPrev, config) => {
  // first draw previous items
  drawPrev?.(ctx);

  const {
    text,
    foregroundColor = "#000",
    fontSize = 16,
    fontFamilyName = "Arial",
    isBold = false,
    isItalic = false,
    x = 0,
    y = 0,
  } = config;

  ctx.fillStyle = foregroundColor;
  ctx.font = `${isBold ? "bold" : ""} ${
    isItalic ? "italic" : ""
  }${fontSize}px '${fontFamilyName}'`;
  ctx.fillText(text, x, y);
};

/** Draw text on a canvas */
export const create = (
  config: IDrawTextConfig,
  input?: RenderTree,
): IRenderItem<IDrawTextConfig> => ({
  name: "drawText",
  config: {
    text: "Text",
    x: 100,
    y: 100,
    foregroundColor: "#000",
    ...config,
  },
  input,
});

const operation = {
  key: "drawText",
  create,
  draw,
  schema,
} as const;
addOperation(operation);

declare global {
  interface IOperations {
    drawText: typeof create;
  }
}
