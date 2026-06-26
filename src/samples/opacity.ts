import { RenderTree } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function opacityTree() {
  const tree: RenderTree = [
    operations.opacity(0.5, [
      operations.drawImage({
        imageUrl: availableImages.cap,
      }),
    ]),
  ];

  return tree;
}
