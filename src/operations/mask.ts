import { IRenderItem, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { addRenderer } from "../renderers";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";
import { create as createBlend } from "./blend";

export interface IMaskConfig extends IConfig {}

const schema: OperationSchema<"mask"> = {
  name: "mask",
  description: "Use children as mask on everything that is already drawn on the layer",
  input: {
    description: "The mask input",
    required: true,
  },
};

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
export const create = (
  mask?: RenderTree | undefined,
): IRenderItem<IMaskConfig> => ({
  name: "mask",
  input: [createBlend("destination-in", mask)],
});

const operation = {
  key: "mask",
  create,
  draw: undefined,
  schema,
} as const;
addOperation(operation);

addRenderer("mask", {
  draw: undefined,
});

// Backward compatibility
export const mask = create;

declare global {
  interface IOperations {
    mask: typeof create;
  }
}
