import { IRenderItem, ItemDrawFn } from "../canvas";
import { addRendererConfig, ItemConfigFn } from "../configs";
import { ItemOverlayFn, addRendererOverlay } from "../overlays";
import { OperationSchema, addSchema } from "../schemas";

import "./draw-image";

declare global {
  interface IOperations {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => IRenderItem<unknown>;
  }
}

export const operations = {} as IOperations;

export type RenderItemName = keyof typeof operations;

export interface IOperation<TKey extends string, TConfig extends object> {
  key: TKey;

  /** Helper function to create an item for the render tree  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (...args: any[]) => IRenderItem<TConfig>;

  /** Render function to apply the operation */
  draw: ItemDrawFn<TConfig>;

  schema?: OperationSchema<TKey>;
  configComponent?: ItemConfigFn<TConfig>;
  overlayComponent?: ItemOverlayFn<TConfig>;
}

export function addOperation<TKey extends string, TConfig extends object>(
  operation: IOperation<TKey, TConfig>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (operations as any)[operation.key] = operation.create;

  if (operation.schema) {
    addSchema(operation.schema);
  }

  if (operation.configComponent) {
    addRendererConfig(operation.key, operation.configComponent);
  }

  if (operation.overlayComponent) {
    addRendererOverlay(operation.key, operation.overlayComponent);
  }
}
