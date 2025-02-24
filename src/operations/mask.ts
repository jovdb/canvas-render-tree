import { IRenderItem, RenderTree } from "../canvas";

/**
 * Currently only opacity layer used of mask
 * Use children as mask on everything that is already draw on the layer
 * You can wrap the mask in a new layer to control the input of the mask
 * @example
 *  drawImage({ image: background })
 *  layer([
 *    fillColor({ color: red }),
 *    mask([    // mask only on layer with fillColor
 *      drawImage({ image: text })
 *    ])
 *  ])
 */
export const mask = (mask?: RenderTree | undefined): IRenderItem => ({
  name: "mask",
  children: mask,
  /*
  draw(ctx, drawPrev, drawChildren) {
    ctx.save();
    // Use alpha
    ctx.globalCompositeOperation = 'destination-in';
    drawChildren?.(ctx); // as new layer?
    ctx.restore();
    return this;
  },*/
  draw(ctx, drawPrev, _config, drawChildren) {
    function apply() {
      ctx.globalCompositeOperation = "destination-in";
    }

    drawPrev?.(ctx);
    if (drawChildren) ctx.save();
    apply();
    drawChildren?.(ctx);
    if (drawChildren) ctx.restore();
    return this;
  },
});
