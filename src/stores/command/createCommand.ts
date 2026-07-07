import { ICommand } from "./types";

/**
 * Identity factory for creating a command.
 * Mainly useful for type inference/documentation at the call site.
 */
export function createCommand<TResult>(
  command: ICommand<TResult>,
): ICommand<TResult> {
  return command;
}
