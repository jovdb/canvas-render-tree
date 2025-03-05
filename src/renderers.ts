import { IItemRenderer } from "./canvas";
import { RenderItemName } from "./operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderers: Partial<Record<RenderItemName, IItemRenderer<any>>> =
  {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addRenderer(name: string, renderer: IItemRenderer<any>) {
  // if (renderers[name as RenderItemName]) {
  //   throw new Error(`Renderer for '${name}' already exists`);
  // }
  renderers[name as RenderItemName] = renderer;
}
