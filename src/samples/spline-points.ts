import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function bSplinePointsTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.testbeeld }),
    operations.bSplinePoints({
      controlPoints: [
        { x: 0.2, y: 0.2, dx: 0, dy: 0.2 },
        { x: 0.8, y: 0.8, dx: -0.1, dy: 0 },
      ],
    }),
  ];
  return tree;
}
