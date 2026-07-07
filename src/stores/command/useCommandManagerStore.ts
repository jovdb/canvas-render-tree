import { create } from "zustand";
import { ICommand } from "./types";

interface CommandStackEntry {
  command: ICommand;
  result: unknown;
}

interface CommandManagerState {
  undoStack: CommandStackEntry[];
  redoStack: CommandStackEntry[];
  actions: {
    add: (command: ICommand) => void;
    undo: () => void;
    redo: () => void;
    clear: () => void;
  };
}

export const useCommandManagerStore = create<CommandManagerState>(
  (set, get) => ({
    undoStack: [],
    redoStack: [],
    actions: {
      add: (command) => {
        const result = command.exec();
        set((state) => ({
          undoStack: [...state.undoStack, { command, result }],
          redoStack: [],
        }));
      },
      undo: () => {
        const { undoStack, redoStack } = get();
        const entry = undoStack[undoStack.length - 1];
        if (!entry) return;

        const result = entry.command.undo(entry.result);
        set({
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, { command: entry.command, result }],
        });
      },
      redo: () => {
        const { undoStack, redoStack } = get();
        const entry = redoStack[redoStack.length - 1];
        if (!entry) return;

        const result = entry.command.redo(entry.result);
        set({
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack, { command: entry.command, result }],
        });
      },
      clear: () => set({ undoStack: [], redoStack: [] }),
    },
  }),
);

export function useCanUndo() {
  return useCommandManagerStore((state) => state.undoStack.length > 0);
}

export function useCanRedo() {
  return useCommandManagerStore((state) => state.redoStack.length > 0);
}

export function useUndoTitle() {
  return useCommandManagerStore((state) => {
    const entry = state.undoStack[state.undoStack.length - 1];
    return entry?.command.getTitle();
  });
}

export function useRedoTitle() {
  return useCommandManagerStore((state) => {
    const entry = state.redoStack[state.redoStack.length - 1];
    return entry?.command.getTitle();
  });
}

export function useCommandManagerActions() {
  return useCommandManagerStore((state) => state.actions);
}
