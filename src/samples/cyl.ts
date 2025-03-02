import { RenderTree } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function cylTree() {
  const tree: RenderTree = [
    operations.drawImage({
      imageUrl: availableImages.cap,
    }),
    operations.cyl(),
  ];

  return tree;
}
