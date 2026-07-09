import { IRenderItem } from "../../canvas";

/**
 * Module-scoped state for the item currently being dragged.
 * Only one drag can be in progress at a time in a single browser tab,
 * so a simple singleton is enough (no need to serialize the item through
 * the native `dataTransfer` payload).
 */
let draggedItem: IRenderItem | undefined;

export function setDraggedItem(item: IRenderItem | undefined) {
  draggedItem = item;
}

export function getDraggedItem(): IRenderItem | undefined {
  return draggedItem;
}
