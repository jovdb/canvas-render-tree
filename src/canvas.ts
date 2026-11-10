import { IConfig } from "./configs";
import { renderers } from "./renderers";

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

export type ItemDrawFn<TConfig = unknown, TResult = void> = (info: {
  ctx: CanvasRenderingContext2D;

  /**
   * Item can decide on which context the previous items must be drawn
   */
  drawPrev: DrawFn | undefined;

  /** Config of the node */
  config: TConfig;

  /**
   * Method that draws args for the operation
   */
  drawArgs?: DrawFn[] | undefined;
}) => TResult;

/**
 * Function to load resources
 * Return undefined is nothing to load or it is cached
 */
export type ItemLoadFn<TConfig = unknown> = (
  /** Config of the node */
  config: TConfig,
) => Promise<void> | undefined;

export interface IItemRenderer<TConfig = unknown> {
  draw?: ItemDrawFn<TConfig>;
  load?: ItemLoadFn<TConfig>;
}

/**
 * The data describing the render step. \
 * This will be serialized and saved
 */
export interface IRenderItem<TConfig extends IConfig = IConfig> {
  /** Node name */
  name: string;

  /** Optional Configuration of the node */
  config?: TConfig;

  // Temporary: remove
  /** @deprecated */
  children?: RenderTree | undefined;

  input?: RenderTree | undefined;

  args?: (RenderTree | undefined)[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RenderTree = IRenderItem<IConfig>[];

export type Drawable = HTMLImageElement | HTMLCanvasElement;

function drawTree(items: RenderTree | undefined) {
  return items?.reduce(
    (prev, item) => {
      return (ctx) => {
        //if (name) con sole.group(name, items?.length ?? 0);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const renderer = (renderers as any)[item.name] as IItemRenderer;
          if (renderer?.draw) {
            renderer.draw({
              ctx,
              drawPrev: prev,
              config: item.config,
              drawArgs: item.args
                ? item.args.map(
                    (arg) => (ctx: CanvasRenderingContext2D) =>
                      drawTree(arg)?.(ctx),
                  )
                : undefined,
            });
          } else {
            // Some items don't have a render function, but add a child render tree
            // throw new Error(`Missing render function for item '${item.name}'`);
            // correct default implementation or better throw
            prev?.(ctx);
            //if (item.children) {
            //  drawTree(item.children, `${item.name}-children`)?.(ctx);
            //}
            console.error(`item '${item.name}' has no draw function`);
          }
        } finally {
          //console.groupEnd();
        }
      };
    },
    undefined as unknown as DrawFn | undefined,
  );
}

export function loadTree(items: RenderTree | undefined) {
  const promises: Promise<void>[] = [];

  // Inner function so I can store promises in the outer scope
  function loadTreeInner(items: RenderTree | undefined) {
    return items?.forEach((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderer = (renderers as any)[item.name] as IItemRenderer;
      if (renderer?.load) {
        const promise = renderer?.load(item.config);
        if (promise) {
          promises.push(promise);
        }
      }

      // Walk children

      // Input
      if (item.input) {
        loadTreeInner(item.input);
      }

      // Args
      item.args?.forEach((arg) => loadTreeInner(arg));
    });
  }

  loadTreeInner(items);

  return promises.length === 0 ? undefined : Promise.all(promises);
}

export function getContext2d(canvas: HTMLCanvasElement, contextName: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(`Error creating canvas 2D context '${contextName}'`);

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

export function redrawTree(canvasEl: HTMLCanvasElement, items: IRenderItem[]) {
  const ctx = getContext2d(canvasEl, "rootCtx");
  ctx.reset(); // clear and reset unclosed operations: globalAlpha, ...
  ctx.globalCompositeOperation = "source-over";
  drawTree(items)?.(ctx);
}
