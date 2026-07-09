import { create } from "zustand";
import { IRenderItem } from "../canvas";
import { createMutationCommand } from "./command/createMutationCommand";
import { useCommandManagerStore } from "./command/useCommandManagerStore";
import { original } from "immer";
import { schemas } from "../schemas";

type WorkTreeUpdater = (currentTree: IRenderItem[]) => IRenderItem[] | void;

interface WorkTreeActions {
  updateWorkTree: (updater: WorkTreeUpdater) => void;
  addItem: (
    tree: readonly IRenderItem[],
    item: IRenderItem,
    atIndex: number,
  ) => void;
  deleteItem: (item: IRenderItem) => void;
  /**
   * Move an existing item (and its whole subtree) to a different location,
   * possibly in a different render-tree level.
   */
  moveItem: (
    item: IRenderItem,
    targetTree: readonly IRenderItem[],
    atIndex: number,
  ) => void;
}

/** Does `node`'s subtree contain (or equal) the given tree array? */
function treeContainsTree(
  node: IRenderItem,
  tree: readonly IRenderItem[],
): boolean {
  if (!Array.isArray(node.args)) return false;
  for (const argTree of node.args) {
    if (!Array.isArray(argTree)) continue;
    if (argTree === tree) return true;
    if (argTree.some((child) => treeContainsTree(child, tree))) return true;
  }
  return false;
}

export const useWorkTreeStore = create<IRenderItem[]>(() => []);

/** Build and dispatch a mutation command for the workTree store. */
function runMutation(
  getTitle: () => string,
  mutate: (draft: IRenderItem[]) => IRenderItem[] | void,
) {
  const command = createMutationCommand({
    getTitle,
    get: () => useWorkTreeStore.getState(),
    set: (state, replace) => {
      if (replace) useWorkTreeStore.setState(state, true);
      else useWorkTreeStore.setState(state);
    },
    mutate,
  });
  useCommandManagerStore.getState().actions.add(command);
}

const actions: WorkTreeActions = {
  updateWorkTree: (updater) => runMutation(() => "Update tree", updater),
  addItem: (tree, item, atIndex) =>
    runMutation(
      () => `Add ${item.name}`,
      (draft) => {
        function addItemInner(items: IRenderItem[] | undefined): boolean {
          if (!Array.isArray(items)) return false;

          // Is this tree?
          if (original(items) === tree) {
            const hasArg = !!schemas[item.name]?.args?.length;

            if (hasArg) {
              const beforeArgs = items.slice(0, atIndex + 1);
              items.splice(0, atIndex + 1, item);
              item.args = [beforeArgs]; // Set as first argument
            } else {
              items.splice(atIndex, 0, item);
            }

            return true;
          }

          // Recursion
          for (const item of items) {
            if (Array.isArray(item.args)) {
              for (const args of item.args) {
                if (addItemInner(args)) return true;
              }
            }
          }
          return false;
        }

        addItemInner(draft);
      },
    ),
  deleteItem: (item) =>
    runMutation(
      () => `Delete item '${item.name}'`,
      (draft) => {
        function deleteItemInner(items: IRenderItem[] | undefined): boolean {
          if (!Array.isArray(items)) return false;

          // Find and array
          const index = items.findIndex((i) => original(i) === item);
          if (index !== -1) {
            // Remove and replace by first arguments
            const args = item.args?.filter((tree) => tree?.length).at(0) ?? [];
            items.splice(index, 1, ...args);
            return true;
          }

          // Recursion
          for (const item of items) {
            if (Array.isArray(item.args)) {
              for (const args of item.args) {
                if (deleteItemInner(args)) return true;
              }
            }
          }
          return false;
        }

        deleteItemInner(draft);
      },
    ),
  moveItem: (item, targetTree, atIndex) => {
    // Prevent dropping an item into its own subtree (would create a cycle)
    if (treeContainsTree(item, targetTree)) return;

    runMutation(
      () => `Move ${item.name}`,
      (draft) => {
        let removedItem: IRenderItem | undefined;
        let removedFromTree: IRenderItem[] | undefined;
        let removedIndex = -1;

        function removeItemInner(items: IRenderItem[] | undefined): boolean {
          if (!Array.isArray(items)) return false;

          const index = items.findIndex((i) => original(i) === item);
          if (index !== -1) {
            removedFromTree = items;
            removedIndex = index;
            [removedItem] = items.splice(index, 1);
            return true;
          }

          for (const child of items) {
            if (Array.isArray(child.args)) {
              for (const args of child.args) {
                if (removeItemInner(args)) return true;
              }
            }
          }
          return false;
        }

        removeItemInner(draft);
        if (!removedItem) return;

        function insertItemInner(items: IRenderItem[] | undefined): boolean {
          if (!Array.isArray(items)) return false;

          if (original(items) === targetTree) {
            let insertIndex = atIndex;
            // Compensate for the shift caused by removing the item earlier
            // from the same array.
            if (removedFromTree === items && removedIndex < atIndex) {
              insertIndex -= 1;
            }
            insertIndex = Math.max(0, Math.min(insertIndex, items.length));
            items.splice(insertIndex, 0, removedItem!);
            return true;
          }

          for (const child of items) {
            if (Array.isArray(child.args)) {
              for (const args of child.args) {
                if (insertItemInner(args)) return true;
              }
            }
          }
          return false;
        }

        insertItemInner(draft);
      },
    );
  },
};

export function useWorkTree() {
  return useWorkTreeStore((state) => state);
}

export function useWorkTreeActions() {
  return actions;
}
