import { RenderItemName } from "../operations";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IConfig {}

const configs: Partial<Record<RenderItemName, ItemConfigFn<IConfig>>> =
  {} as const;

/** Function to configure an item */
export type ItemConfigFn<TConfig = IConfig> = (props: {
  config: Readonly<TConfig>;
  mutateConfig: (mutate: (config: TConfig) => void) => void;
}) => React.ReactNode;

export function addRendererConfig(
  name: string,
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
): ItemConfigFn<IConfig> | undefined {
  if (!name) return undefined;
  const configComponent = configs[name as RenderItemName];
  return configComponent;
}
