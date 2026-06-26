import { IRenderItem } from "../canvas";
import { addRenderer } from "../renderers";
import { create } from "./blend";

/**
 * Repaint pixels based on transparency
 * Same as blend("source-in")
 */
export const repaint = (
  /** Repaint with
   * 1 draw operation required, bundle in layer if needed
   */
  repaintWith: [IRenderItem],
): IRenderItem => ({
  name: "repaint",
  input: [create("source-in", repaintWith)],
});

addRenderer("repaint", {
  draw: undefined,
});
