import { IRenderItem, RenderTree } from '../canvas';

// WIP

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
export const mask = (
  mask: RenderTree,
  /** Only mask what is draw here s */
  input?: RenderTree
): IRenderItem => ({
  name: 'mask',
  childNodes: {
    input: input,
    mask,
  },
  draw(ctx, drawChildren) {
    ctx.save();
    if (input) {
    }
    drawChildren?.(ctx, mask); // as new layer?
    // Use alpha
    ctx.globalCompositeOperation = 'destination-in';
    drawChildren?.(ctx, mask); // as new layer?
    ctx.restore();
    return this;
  },
});
