import { useLayoutEffect, useRef } from 'react';
import { draw, IRenderItem } from '../canvas';

export function Canvas({ items }: { items: IRenderItem[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    //draw([operations.fillColor("#fff"), ...items]);
    draw(items);
  }, [items]);

  return <canvas ref={canvasRef} width="500" height="500" className="canvas" />;
}
