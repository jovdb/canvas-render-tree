import { getContext2d, IRenderItem, RenderTree } from "../canvas";

/**
 * Add shadow last painted item, use a layer to appy on all
 * Tip: Use a child layer to apply shadow once on complete image
 */
export const shadow = (
  {
    type = "outer",
    shadowBlur = 10,
    shadowOffsetX = 5,
    shadowOffsetY = 5,
    shadowColor = "#0008",
  }: {
    type: "outer" | "inner";
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowColor?: string;
  },
  children?: RenderTree
): IRenderItem => ({
  name: "shadow",
  children,
  draw(ctx, drawPrev, drawChildren) {
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

    /*
    // invert alpha channel
    ctx.globalCompositeOperation = 'xor';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // draw itself again using drop-shadow filter
    ctx.shadowBlur = 7 * 2; // use double of what is in CSS filter (Chrome x4)
    ctx.shadowOffsetX = ctx.shadowOffsetY = 5;
    ctx.shadowColor = '#000';
    drawChildren?.(ctx);

    // draw original image with background mixed on top
    ctx.globalCompositeOperation = 'destination-atop';
    ctx.shadowColor = 'transparent'; // remove shadow !
    //ctx.drawImage(this, 0, 0);
    drawChildren?.(ctx);
    */
  },
});
