import { RenderTree } from './canvas';

function walk(items: RenderTree | undefined, name = '') {
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
          prev(ctx);
          item.draw(
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

const ctx = 42 as unknown as CanvasRenderingContext2D;
walk([], 'root')?.(ctx);
