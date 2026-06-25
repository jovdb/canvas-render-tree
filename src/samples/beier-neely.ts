import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function beierNeelyTree() {
  const controlPoints = [];
  for (let x = 0; x <= 1; x += 0.25) {
    for (let y = 0; y <= 1; y += 0.25) {
      controlPoints.push({
        x,
        y,
        dx: (0.5 - x) * 0.1 * y,
        dy: (0.5 - y) * 0.1,
      });
    }
  }

  const tree: IRenderItem[] = [
    operations.beierNeely(
      {
        strength: 1.0,
        falloff: 2.0,
        minDistance: 0.01,
        controlPoints,
      },
      [operations.drawImage({ imageUrl: availableImages.testbeeld })],
    ),
  ];
  return tree;
}
