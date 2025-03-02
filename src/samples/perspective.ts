import { RenderTree } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function perspectiveTree() {
  const tree: RenderTree = [
    operations.drawImage({
      imageUrl: availableImages.cap,
    }),
    operations.perspective({
      controlPoints: [
        { x: 0.1, y: 0.2 },
        { x: 0.9, y: 0.1 },
        { x: 0.95, y: 0.7 },
        { x: 0, y: 0.9 },
      ],
    }),
  ];

  return tree;
}
