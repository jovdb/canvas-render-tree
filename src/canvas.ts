import React from "react";
import { CanvasContext } from "./canvas-context";
import { renderers } from "./renderers";

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

export type ItemDrawFn<TConfig = unknown> = (
  ctx: CanvasRenderingContext2D,

  /**
   * Item can decide on which context the previous items must be drawn
   */
  drawPrev: DrawFn | undefined,

  /** Config of the node */
  config: TConfig,

  /**
   * Method that draws the children of this render item
   */
  drawChildren: DrawFn | undefined
) => void;

/** Function to configure an item */
export type ItemConfigFn<TConfig = unknown> = (props: {
  config: Readonly<TConfig>;
  mutateConfig: (mutate: (config: TConfig) => void) => void;
}) => React.ReactNode;

export interface IRenderItem<TConfig = unknown> {
  /** Node name */
  name: string;

  /** Optional Configuration of the node */
  config?: TConfig;

  children?: RenderTree | undefined;

  /** function to render */
  // draw?: ItemDrawFn<TConfig>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RenderTree = IRenderItem<any>[];

export type Drawable = HTMLImageElement | HTMLCanvasElement;

function walk(items: RenderTree | undefined, name = "") {
  return items?.reduce((prev, item) => {
    return (ctx) => {
      //if (name) console.group(name, items?.length ?? 0);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const render = (renderers as any)[item.name];
        if (render) {
          render(
            ctx,
            prev,
            item.config,
            item.children
              ? (ctx: CanvasRenderingContext2D) =>
                  walk(item.children, `${item.name}-children`)?.(ctx)
              : undefined
          );
        } else {
          // Some items don't have a render function, but add a child render tree
          // throw new Error(`Missing render function for item '${item.name}'`);
          // correct default implementation or better throw
          prev?.(ctx);
          if (item.children) {
            walk(item.children, `${item.name}-children`)?.(ctx);
          }
        }
      } finally {
        //console.groupEnd();
      }
    };
  }, undefined as unknown as DrawFn | undefined);
}

export function getContext2d(canvas: HTMLCanvasElement, name: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Error creating canvas 2D context");

  return ctx;
  /*
  const ctx2 = new CanvasContext(
    ctx,
    console,
    name
  ) as unknown as CanvasRenderingContext2D;

  return new Proxy(ctx2, {
    set(target, key: keyof CanvasRenderingContext2D, value) {
      if (!(key in target)) {
        throw new Error(`Missing prop '${key}' on CanvasContext`);
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (target[key as any] = value);
    },
  });
  */
}

export function draw(items: IRenderItem[]) {
  const canvasEl = document.querySelector<HTMLCanvasElement>("canvas")!;
  const ctx = getContext2d(canvasEl, "rootCtx");
  ctx.reset(); // clear and reset unclosed operations: globalAlpha, ...
  walk(items, "root")?.(ctx);
}
