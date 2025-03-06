import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { createOriginalGrid } from "../operations/bicubic-grid";
import { availableImages } from "../resources";

export function pillowTree() {
  const rows = 3;
  const cols = 3;

  const deformationGrid = createOriginalGrid(rows, cols);

  // Top
  deformationGrid[0][0].x += 0.15;
  deformationGrid[0][0].y += 0.15;

  deformationGrid[0][1].y += 0.3;

  deformationGrid[0][2].x -= 0.17;
  deformationGrid[0][2].y += 0.15;

  // Center
  deformationGrid[1][0].x += 0.3;
  
  deformationGrid[1][2].x -= 0.3;

  // Bottom
  deformationGrid[2][0].x += 0.15;
  deformationGrid[2][0].y -= 0.18;

  deformationGrid[2][1].y -= 0.3;

  deformationGrid[2][2].x -= 0.15;
  deformationGrid[2][2].y -= 0.18;

  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.pillow }),
    operations.blend("multiply"),
    operations.layer([
      operations.drawImage({ imageUrl: availableImages.parrot }),
      operations.bicubicGrid({
        controlsPoints: deformationGrid,
        // debug: true,
      }),
    ]),
  ];
  return tree;
}
