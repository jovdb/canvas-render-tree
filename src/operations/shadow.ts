import { getContext2d, IRenderItem, ItemDrawFn, RenderTree } from "../canvas";

export interface IShadowConfig {
  type: "outer" | "inner";
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowColor: string;
}

/**
 * Add shadow last painted item, use a layer to appy on all
 * Tip: Use a child layer to apply shadow once on complete image
 */
export const shadow = (
  config: IShadowConfig,
  children?: RenderTree
): IRenderItem => ({
  name: "shadow",
  config,
  children,
});

export const drawShadow: ItemDrawFn<IShadowConfig> = (
  ctx,
  drawPrev,
  config,
  drawChildren
) => {
  const {
    type = "outer",
    shadowBlur = 10,
    shadowOffsetX = 5,
    shadowOffsetY = 5,
    shadowColor = "#0008",
  } = config;

  // drawChildren?.(ctx);
  function apply(ctx: CanvasRenderingContext2D) {
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.shadowColor = shadowColor;
    // ctx.filter = `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})`
  }

  if (type === "outer") {
    drawPrev?.(ctx);
    apply(ctx);
    drawChildren?.(ctx);
    return;
  } else if (type === "inner") {
    // Create shadow in a new layer
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = ctx.canvas.width;
    shadowCanvas.height = ctx.canvas.height;
    const shadowCtx = getContext2d(shadowCanvas, "shaowCtx");

    // invert transparency: Create an image with transparent area for the shadow
    shadowCtx.fillStyle = "white"; // color doesn't matter because it will be later removed with mask
    shadowCtx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    shadowCtx.globalCompositeOperation = "xor";
    if (drawChildren) drawChildren?.(shadowCtx);
    else drawPrev?.(shadowCtx);

    // Create mask in a new layer
    const maskedCanvas = document.createElement("canvas");
    maskedCanvas.width = ctx.canvas.width;
    maskedCanvas.height = ctx.canvas.height;
    const maskedCtx = getContext2d(maskedCanvas, "maskedCtx");

    // Mask to get only the shadows
    maskedCtx.save();
    apply(maskedCtx);
    maskedCtx.drawImage(shadowCtx.canvas, 0, 0);
    maskedCtx.restore();
    maskedCtx.globalCompositeOperation = "destination-out";
    maskedCtx.drawImage(shadowCtx.canvas, 0, 0);

    ctx.save();
    if (drawChildren) drawChildren?.(ctx);
    else drawPrev?.(ctx);

    ctx.drawImage(maskedCtx.canvas, 0, 0); // Add masked shadow on top
    ctx.restore();
  }
};
