import { IRenderItem, RenderTree } from "../canvas";
import { IConfig } from "../configs";
import { addRenderer } from "../renderers";
import { OperationSchema } from "../schemas";
import { addOperation } from ".";
import { create as createBlend } from "./blend";

export interface IRepaintConfig extends IConfig {}

const schema: OperationSchema<"repaint"> = {
  name: "repaint",
  description: "Repaint pixels based on transparency (same as blend source-in)",
  input: {
    required: true,
  },
  args: [],
};

/**
 * Repaint pixels based on transparency
 * Same as blend("source-in")
 */
export const create = (
  /** Repaint with
   * 1 draw operation required, bundle in layer if needed
   */
  repaintWith: [IRenderItem],
): IRenderItem<IRepaintConfig> => ({
  name: "repaint",
  input: [createBlend("source-in", repaintWith)],
});

const operation = {
  key: "repaint",
  create,
  draw: undefined,
  schema,
} as const;
addOperation(operation);

addRenderer("repaint", {
  draw: undefined,
});

// Backward compatibility
export const repaint = create;

declare global {
  interface IOperations {
    repaint: typeof create;
  }
}
