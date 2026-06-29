import { RenderTree } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function opacityTree() {
  const tree: RenderTree = [
    operations.drawImage({
      imageUrl: availableImages.wood,
    }),
    operations.opacity(0.5, [
      operations.drawImage({
        imageUrl: availableImages.homer,
      }),
    ]),
  ];

  return tree;
}
