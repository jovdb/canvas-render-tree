import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function engravedGlassTree() {
  const tree: IRenderItem[] = [
    // operations.drawImage({ imageUrl: availableImages.glass }),
    // operations.layer([
    //   operations.drawImage({ imageUrl: availableImages.noise }),
    //   operations.fillColor("#0001"), // make a bit darker
    //   operations.mask([operations.drawImage({ imageUrl: availableImages.glassText })]),
    // ]),
    // operations.shadow({
    //   type: "inner",
    //   shadowBlur: 2,
    //   shadowOffsetX: 3,
    //   shadowOffsetY: 3,
    //   shadowColor: "#0003",
    // }),

    operations.drawImage({ imageUrl: availableImages.glass }),
    operations.blend("multiply", [
      operations.shadow(
        {
          type: "inner",
          shadowBlur: 2,
          shadowOffsetX: 2,
          shadowOffsetY: 2,
          shadowColor: "#0002",
        },
        [
          operations.layer([
            operations.drawImage({ imageUrl: availableImages.noise }),
            operations.fillColor("#0001"), // make a bit darker
            operations.blend("destination-in", [
              operations.drawText({
                text: "Kelly",
                x: 162,
                y: 150,
                fontFamilyName: "Arial",
                fontSize: 70,
                isBold: true,
              }),
            ]),
          ]),
        ],
      ),
    ]),
  ];
  return tree;
}
