import { ItemConfigFn } from "../canvas";
import { RenderItemName } from "../operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const configs: Partial<Record<RenderItemName, ItemConfigFn<any>>> = {} as const;

export function addRendererConfig(
  name: RenderItemName,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rendererConfig: ItemConfigFn<any>,
) {
  // Disabled for hot module reloading
  // if (configs[name as RenderItemName]) {
  //   throw new Error(`Renderer config for '${name}' already exists`);
  // }
  configs[name as RenderItemName] = rendererConfig;
}

export function getRendererConfig(
  name: RenderItemName | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ItemConfigFn<any> | undefined {
  return configs[name as RenderItemName];
}
