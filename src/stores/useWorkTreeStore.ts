import { produce } from "immer";
import { create } from "zustand";
import { IRenderItem, RenderTree } from "../canvas";
import { TreeIndex } from "../components/RenderTree";

type WorkTreeUpdater = (currentTree: IRenderItem[]) => IRenderItem[] | void;

interface WorkTreeActions {
  setWorkTree: (tree: IRenderItem[] | WorkTreeUpdater) => void;
  updateWorkTree: (updater: WorkTreeUpdater) => void;
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
      const replacementItems =
        (itemToReplace.args?.flatMap((arg) => arg ?? []) ?? []) as IRenderItem[];
      newItems.splice(targetPos, 1, ...replacementItems);
    }

    return newItems;
  }

  const newItems = [...items];
  const parentItem = newItems[targetPos];
  if (!parentItem) return newItems;

  const [childTargetPos, ...childRestIndex] = restIndex;
  const flatArgs =
    (parentItem.args?.flatMap((arg) => arg ?? []) ?? []) as IRenderItem[];

  if (childTargetPos < flatArgs.length) {
    let positionInFoundArg = childTargetPos;
    let foundArgIndex = -1;

    for (let i = 0; i < (parentItem.args?.length ?? 0); i++) {
      const arg = parentItem.args![i];
      if (arg && positionInFoundArg < arg.length) {
        foundArgIndex = i;
        break;
      }
      if (arg) {
        positionInFoundArg -= arg.length;
      }
    }

    if (foundArgIndex >= 0 && parentItem.args) {
      const newArgs = [...parentItem.args];
      const argArray = [...(newArgs[foundArgIndex] ?? [])] as IRenderItem[];

      if (childRestIndex.length === 0) {
        const itemToReplace = argArray[positionInFoundArg];
        const replacementItems =
          (itemToReplace?.args?.flatMap((arg) => arg ?? []) ?? []) as IRenderItem[];
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
    const input = (parentItem.args?.flatMap((arg) => arg ?? []) ?? []) as IRenderItem[];

    if (childRestIndex.length === 0) {
      const newInput = [...input];
      const itemToReplace = newInput[positionInInput];
      const replacementItems =
        (itemToReplace?.args?.flatMap((arg) => arg ?? []) ?? []) as IRenderItem[];
      newInput.splice(positionInInput, 1, ...replacementItems);
      newItems[targetPos] = {
        ...parentItem,
        args: newInput.length > 0 ? [newInput as RenderTree] : undefined,
      };
    } else {
      const newInput = replaceWithInput(input, [
        positionInInput,
        ...childRestIndex,
      ]);
      newItems[targetPos] = {
        ...parentItem,
        args: newInput.length > 0 ? [newInput as RenderTree] : undefined,
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
        workTree:
          typeof tree === "function"
            ? produce(state.workTree, (draft) => {
                const result = tree(draft);
                if (Array.isArray(result)) {
                  return result;
                }
              })
            : tree,
      })),
    updateWorkTree: (updater) =>
      set((state) => ({
        workTree: produce(state.workTree, (draft) => {
          updater(draft);
        }),
      })),
    addItem: (item, index) =>
      set((state) => ({
        workTree: produce(state.workTree, (draft) => {
          if (typeof index === "number") {
            draft.splice(index, 0, item);
          } else {
            draft.push(item);
          }
        }),
      })),
    deleteItem: (targetIndex) =>
      set((state) => ({
        workTree: produce(state.workTree, (draft) => {
          return replaceWithInput(draft, targetIndex);
        }),
      })),
  },
}));

export function useWorkTree() {
  return useWorkTreeStore((state) => state.workTree);
}

export function useWorkTreeActions() {
  return useWorkTreeStore((state) => state.actions);
}
