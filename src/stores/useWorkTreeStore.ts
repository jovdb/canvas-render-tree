import { create } from "zustand";
import { IRenderItem } from "../canvas";
import { TreeIndex } from "../components/RenderTree";

interface WorkTreeActions {
  setWorkTree: (
    tree: IRenderItem[] | ((currentTree: IRenderItem[]) => IRenderItem[]),
  ) => void;
  resetWorkTree: (tree: IRenderItem[]) => void;
  updateWorkTree: (
    updater: (currentTree: IRenderItem[]) => IRenderItem[],
  ) => void;
  addItem: (item: IRenderItem, index?: number) => void;
  deleteItem: (targetIndex: TreeIndex) => void;
}

interface WorkTreeState {
  workTree: IRenderItem[];
  actions: WorkTreeActions;
}

function replaceWithInput(
  items: readonly IRenderItem[],
  targetIndex: TreeIndex,
): IRenderItem[] {
  if (targetIndex.length === 0) return [...items];

  const [targetPos, ...restIndex] = targetIndex;

  if (restIndex.length === 0) {
    const newItems = [...items];
    const itemToReplace = newItems[targetPos];

    if (itemToReplace) {
      const replacementItems = itemToReplace.args?.flat() ?? [];
      newItems.splice(targetPos, 1, ...replacementItems);
    }

    return newItems;
  }

  const newItems = [...items];
  const parentItem = newItems[targetPos];
  if (!parentItem) return newItems;

  const [childTargetPos, ...childRestIndex] = restIndex;
  const flatArgs = parentItem.args?.flat() ?? [];

  if (childTargetPos < flatArgs.length) {
    let positionInFoundArg = childTargetPos;
    let foundArgIndex = -1;

    for (let i = 0; i < (parentItem.args?.length ?? 0); i++) {
      const arg = parentItem.args![i];
      if (positionInFoundArg < arg.length) {
        foundArgIndex = i;
        break;
      }
      positionInFoundArg -= arg.length;
    }

    if (foundArgIndex >= 0 && parentItem.args) {
      const newArgs = [...parentItem.args];
      const argArray = [...newArgs[foundArgIndex]];

      if (childRestIndex.length === 0) {
        const itemToReplace = argArray[positionInFoundArg];
        const replacementItems = itemToReplace?.args?.flat() ?? [];
        argArray.splice(positionInFoundArg, 1, ...replacementItems);
      } else {
        const newArgArray = replaceWithInput(argArray, [
          positionInFoundArg,
          ...childRestIndex,
        ]);
        newArgs[foundArgIndex] = newArgArray;
      }

      newItems[targetPos] = {
        ...parentItem,
        args: newArgs.length > 0 ? newArgs : undefined,
      };
    }
  } else {
    const positionInInput = childTargetPos - flatArgs.length;
    const input = parentItem.args?.flat() ?? [];

    if (childRestIndex.length === 0) {
      const newInput = [...input];
      const itemToReplace = newInput[positionInInput];
      const replacementItems = itemToReplace?.args?.flat() ?? [];
      newInput.splice(positionInInput, 1, ...replacementItems);
      newItems[targetPos] = {
        ...parentItem,
        args: newInput.length > 0 ? [newInput] : undefined,
      };
    } else {
      const newInput = replaceWithInput(input, [
        positionInInput,
        ...childRestIndex,
      ]);
      newItems[targetPos] = {
        ...parentItem,
        args: newInput.length > 0 ? [newInput] : undefined,
      };
    }
  }

  return newItems;
}

export const useWorkTreeStore = create<WorkTreeState>((set) => ({
  workTree: [],
  actions: {
    setWorkTree: (tree) =>
      set((state) => ({
        workTree: typeof tree === "function" ? tree(state.workTree) : tree,
      })),
    resetWorkTree: (tree) => set({ workTree: tree }),
    updateWorkTree: (updater) =>
      set((state) => ({ workTree: updater(state.workTree) })),
    addItem: (item, index) =>
      set((state) => {
        const nextTree = [...state.workTree];
        if (typeof index === "number") {
          nextTree.splice(index, 0, item);
        } else {
          nextTree.push(item);
        }
        return { workTree: nextTree };
      }),
    deleteItem: (targetIndex) =>
      set((state) => ({
        workTree: replaceWithInput(state.workTree, targetIndex),
      })),
  },
}));

export function useWorkTree() {
  return useWorkTreeStore((state) => state.workTree);
}

export function useWorkTreeActions() {
  return useWorkTreeStore((state) => state.actions);
}
