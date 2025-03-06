import { RenderTree } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function capTree() {
  // const tree: IRenderItem[] = [
  //   operations.drawImage({ imageUrl: availableImages.cap }),
  //   operations.blend("multiply", [
  //     operations.layer([
  //       operations.fillColor("red"),
  //       operations.mask([operations.drawImage({ imageUrl: availableImages.glassText })]),
  //       operations.bevel({}),
  //     ]),
  //   ]),
  // ];

  const tree: RenderTree = [
    operations.fillColor("#ff0000"),
    operations.blend("destination-in", [
      operations.drawText({
        text: "Kelly",
        fontSize: 80,
        x: 152,
        y: 220,
        isBold: true,
      }),
    ]),
    operations.bevel({}),
    operations.blend("multiply"),
    operations.drawImage({ imageUrl: availableImages.cap }),
  ];

  return tree;
}
