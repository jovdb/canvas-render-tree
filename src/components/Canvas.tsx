import { useRef } from "react";
import { draw, IRenderItem, loadTree } from "../canvas";
import { useQuery } from "@tanstack/react-query";
import { validateSchemas } from "../schemas";

export function Canvas({ items }: { items: IRenderItem[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isFetching, error } = useQuery({
    queryKey: ["canvas", items],
    queryFn: async () => {
      if (!canvasRef.current) return;
      if (!items?.length) return;
      validateSchemas(items);
      await loadTree(items);
      draw(canvasRef.current, items);
      return null;
    },
  });
  return (
    <>
      <canvas ref={canvasRef} width="500" height="500" className="canvas" />
      {false && isFetching && <div>Loading...</div>}
      {error && (
        <div style={{ color: "red" }}>Error: {(error as Error).message}</div>
      )}
    </>
  );
}
