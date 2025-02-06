import { CanvasContext } from "./canvas-context";

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

type ItemDrawFn = (
  ctx: CanvasRenderingContext2D,

  /**
   * Item can decide on wich context the previous items must be drawn
   */
  drawPrev: DrawFn | undefined,
  /**
   * Method that draws the children of this render item
   */
  drawChildren: DrawFn | undefined
) => void;

export interface IRenderItem {
  name: string;
  children?: RenderTree | undefined;
  childNodes?: Record<string, RenderTree | undefined> | undefined;
  draw?(
    ctx: CanvasRenderingContext2D,
    /**
     * When there are children, a drawChildren function is passed
     * The renderItem should becide to draw before, after, or both, pass the render context to draw on, ...
     */
    drawChildren:
      | undefined
      | ((ctx: CanvasRenderingContext2D, items?: RenderTree) => void)
  ): void;

  draw2?: ItemDrawFn;
}

export type RenderTree = IRenderItem[];

export type Drawable = HTMLImageElement | HTMLCanvasElement;
/*
function walkItem(item: IRenderItem, ctx: CanvasRenderingContext2D) {
  // Caller execute code before, after, or both, pass new context
  console.group(item.name);
  try {
    item.draw2(ctx, drawPrev, (ctx, children = item.children) =>
      children ? walk(children, ctx, `${item.name}: children`) : undefined
    );
  } finally {
    console.groupEnd();
  }
}*/

/*
function walk(items: RenderTree, ctx: CanvasRenderingContext2D, name = '') {
  console.group(name);
  try {
    items.forEach((item) => walkItem(item, ctx));

  } finally {
    if (name) console.groupEnd();
  }
}
*/

function walk(items: RenderTree | undefined, name = "") {
  return items?.reduce((prev, item) => {
    return (ctx) => {
      if (name) console.group(name, items?.length ?? 0);
      try {
        if (item.draw2) {
          item.draw2(
            ctx,
            prev,
            item.children
              ? (ctx) => walk(item.children, `${item.name}-children`)?.(ctx)
              : undefined
          );
        } else {
          prev?.(ctx);
          item.draw?.(
            ctx,
            item.children
              ? (ctx) => walk(item.children, `${item.name}-children`)?.(ctx)
              : undefined
          );
        }
      } finally {
        console.groupEnd();
      }
    };
  }, undefined as unknown as DrawFn | undefined);
}

export function getContext2d(canvas: HTMLCanvasElement, name: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Error creating canvas 2D context");

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
      return target[key as any] = value;
    },
  });
}

export function draw(items: IRenderItem[]) {
  const canvasEl = document.querySelector<HTMLCanvasElement>("canvas")!;
  const ctx = getContext2d(canvasEl, "rootCtx");
  ctx.reset(); // clear and reset unclosed operations: globalAlpha, ...
  walk(items, "root")?.(ctx);
}
