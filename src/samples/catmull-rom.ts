import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { availableImages } from "../resources";

export function catmullRomTree() {
  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.testbeeld }),
    operations.catmullRom({
      gridCols: 3,
      gridRows: 3,
      controlPoints: [
        {
          col: 1,
          row: 1,
          dx: 0.2,
          dy: 0.1,
        },
      ],
    }),
  ];
  return tree;
}
