import { IRenderItem, RenderTree } from "../canvas";
import { blend } from "./blend";

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
  children: [blend("destination-in", mask)],
});
