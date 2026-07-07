/** Action that was last performed on a command, used for `getDescription`. */
export type CommandAction = "exec" | "undo" | "redo";

/**
 * A single undoable/redoable unit of work.
 *
 * `TResult` is whatever data the command needs to remember between
 * `exec`/`undo`/`redo` calls (e.g. immer patches).
 */
export interface ICommand<TResult = unknown> {
  /** Human readable title, e.g. shown in an undo/redo menu. */
  getTitle(): string;
  /** Perform the action and return data needed to undo it later. */
  exec(): TResult;
  /** Revert the action using the result of the previous `exec`/`redo` call. */
  undo(execResult: TResult): TResult;
  /** Re-apply the action using the result of the previous `undo` call. */
  redo(undoResult: TResult): TResult;
  /** Optional detailed description, e.g. for tooltips/logging. */
  getDescription?(
    prevResult: TResult | undefined,
    lastAction: CommandAction | undefined,
  ): string;
  /**
   * Pass true if undo/redo doesn't need to stop for this command.
   * @deprecated Temporary not used to prevent confusion.
   */
  isNoUndoRedoStop?: boolean;
}
