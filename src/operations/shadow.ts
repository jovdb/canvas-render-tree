import { getContext2d, IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRenderer } from "../renderers";

export interface IShadowConfig {
  type?: "outer" | "inner";
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowColor?: string;
  onlyShadow?: boolean;
}

/**
 * Add shadow last painted item, use a layer to apply on all
 * Tip: Use a child layer to apply shadow once on complete image
 */
export const shadow = (
  config: IShadowConfig,
  children?: RenderTree,
): IRenderItem => ({
  name: "shadow",
  config,
  children,
});

export const draw: ItemDrawFn<IShadowConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  const {
    type = "outer",
    shadowBlur = 10,
    shadowOffsetX = 5,
    shadowOffsetY = 5,
    shadowColor = "#0008",
    onlyShadow = false,
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
    drawInput?.(ctx);
    return;
  } else if (type === "inner") {
    // How to draw inner canvas:
    // - 1. create an invert image of the transparency
    // - 2. apply shadow on the invert image
    // - 3. draw it over the image

    // Data for inner shadow
    // Store in imagedata so only called once (if complex inner renderings)
    const dataCanvas = document.createElement("canvas");
    dataCanvas.width = ctx.canvas.width;
    dataCanvas.height = ctx.canvas.height;
    const tempCtx = getContext2d(dataCanvas, "tempCtx");

    drawInput?.(tempCtx);

    // 1. Create an image with transparent area for the shadow
    const invertedImageCanvas = document.createElement("canvas");
    invertedImageCanvas.width = ctx.canvas.width;
    invertedImageCanvas.height = ctx.canvas.height;
    const invertedImageCtx = getContext2d(
      invertedImageCanvas,
      "invertedImageCtx",
    );

    invertedImageCtx.fillStyle = "#ffff"; // TODO: improve, color is visible at the edges
    invertedImageCtx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    invertedImageCtx.globalCompositeOperation = "xor";
    invertedImageCtx.drawImage(dataCanvas, 0, 0);

    // 2. Draw as image onto new layer with shadow
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = ctx.canvas.width;
    shadowCanvas.height = ctx.canvas.height;
    const shadowCtx = getContext2d(shadowCanvas, "shadowCanvas");

    // Mask to get only the shadows
    shadowCtx.save();
    apply(shadowCtx);
    shadowCtx.drawImage(invertedImageCtx.canvas, 0, 0);
    shadowCtx.restore();
    // Apply inverted image as mask
    shadowCtx.globalCompositeOperation = "destination-out";
    shadowCtx.drawImage(invertedImageCtx.canvas, 0, 0);

    // 3. Draw shadow on top
    ctx.save();
    drawPrev?.(ctx);
    if (!onlyShadow) {
      ctx.drawImage(dataCanvas, 0, 0);
    }
    ctx.drawImage(shadowCanvas, 0, 0); // Add masked shadow on top
    ctx.restore();
  }
};

addRenderer("shadow", {
  draw,
});
