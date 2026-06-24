import { RenderItemName } from "./operations";

/** Function to configure an item */
export type ItemOverlayFn<TConfig = unknown> = (props: {
  config: Readonly<TConfig>;
  mutateConfig: (mutate: (config: TConfig) => void) => void;
}) => React.ReactNode;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const overlays: Partial<Record<RenderItemName, ItemOverlayFn<any>>> =
  {} as const;

export function addRendererOverlay(
  name: RenderItemName,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rendererOverlay: ItemOverlayFn<any>,
) {
  overlays[name as RenderItemName] = rendererOverlay;
}

export function getRendererOverlay(
  name: RenderItemName | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ItemOverlayFn<any> | undefined {
  if (!name) return undefined;
  const overlayComponent = overlays[name as RenderItemName];
  return overlayComponent;
}
