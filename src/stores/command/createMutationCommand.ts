import { Patch, applyPatches, enablePatches, produceWithPatches } from "immer";
import { createCommand } from "./createCommand";
import { CommandAction, ICommand } from "./types";

enablePatches();

function logPatches(patches: readonly Patch[]): string {
  return patches
    .map((patch) => `${patch.op} ${patch.path.join(".")}`)
    .join("\n");
}

interface MutationResult {
  patches: Patch[];
  inversePatches: Patch[];
}

/**
 * Create a sync command based on a mutate function that automatically detects changes for undo/redo.
 */
export function createMutationCommand<T extends object>({
  getTitle,
  get,
  set,
  mutate,
  isNoUndoRedoStop,
}: {
  getTitle: ICommand<MutationResult>["getTitle"];
  /** Get current State */
  get: () => T;
  /** Set new state */
  set: (state: T, replace: boolean | undefined) => void;
  /** Mutate the draft state passed and it will update the state with a new immutable state */
  mutate: (draft: T) => T | void;
  /**
   * Pass true if undo/redo doesn't need to stop for this command
   * @deprecated Temporary not used to prevent confusion.
   */
  isNoUndoRedoStop?: boolean;
}): ICommand<MutationResult> {
  return createCommand({
    getTitle,
    exec: () => {
      const state = get();
      const [newState, patches, inversePatches] = produceWithPatches(
        state,
        mutate,
      );
      set(newState, true); // Pass true to prevent partial updates where we cannot remove items

      return {
        patches,
        inversePatches,
      };
    },
    undo: (execResult) => {
      const { inversePatches } = execResult;
      const state = get();
      const newState = applyPatches(state, inversePatches);
      set(newState, true); // Pass true to prevent partial updates where we cannot remove items
      return execResult;
    },
    redo: (undoResult) => {
      const { patches } = undoResult;
      const state = get();
      const newState = applyPatches(state, patches);
      set(newState, true); // Pass true to prevent partial updates where we cannot remove items
      return undoResult;
    },
    getDescription(prevResult, lastAction: CommandAction | undefined) {
      if (!lastAction || !prevResult) return "";
      const { patches, inversePatches } = prevResult;
      const title = getTitle();
      if (lastAction === "undo")
        return `${title}\n${logPatches(inversePatches ?? [])}`;
      return `${title}\n${logPatches(patches ?? [])}`;
    },
    isNoUndoRedoStop,
  });
}
