import { RenderTree } from "../canvas";
import { operations } from "../operations";
import { IRenderResources } from "../resources";

export function capTree(resources: IRenderResources) {
  // const tree: IRenderItem[] = [
  //   operations.drawImage({ image: resources.cap }),
  //   operations.blend("multiply", [
  //     operations.layer([
  //       operations.fillColor("red"),
  //       operations.mask([operations.drawImage({ image: resources.glassText })]),
  //       operations.bevel({}),
  //     ]),
  //   ]),
  // ];

  const tree: RenderTree = [
    operations.fillColor("red"),
    operations.mask([operations.drawImage({ image: resources.glassText })]),
    operations.bevel({}),
    operations.blend("multiply"),
    operations.drawImage({ image: resources.cap }),
  ];

  return tree;
}
