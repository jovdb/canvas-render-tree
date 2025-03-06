import { IRenderItem } from "../canvas";
import { operations } from "../operations";
import { createOriginalGrid } from "../operations/bicubic-grid";
import { availableImages } from "../resources";

export function pillow2Tree() {
  const rows = 3;
  const cols = 3;

  const deformationGrid = createOriginalGrid(rows, cols);

  // Top
  deformationGrid[0][0].x += 0.18;
  deformationGrid[0][0].y += 0.21;

  deformationGrid[0][1].x += 0.2;
  deformationGrid[0][1].y += 0.44;

  deformationGrid[0][2].x += 0.0;
  deformationGrid[0][2].y += 0.5;

  // Center
  deformationGrid[1][0].x += 0.21;
  deformationGrid[1][0].y -= 0.2;
  
  deformationGrid[1][1].x += 0.0;
  deformationGrid[1][1].y -= 0.05;
  

  deformationGrid[1][2].x -= 0.22;
  deformationGrid[1][2].y += 0.05;

  // Bottom
  deformationGrid[2][0].x -= 0.1;
  deformationGrid[2][0].y -= 1.1;

  deformationGrid[2][1].y -= 0.70;

  deformationGrid[2][2].x -= 0.25;
  deformationGrid[2][2].y -= 0.20;

  const tree: IRenderItem[] = [
    operations.drawImage({ imageUrl: availableImages.pillow2 }),
    operations.blend("multiply"),
    operations.layer([
      operations.drawImage({ imageUrl: availableImages.checkerboard }),
      operations.bicubicGrid({
        controlsPoints: deformationGrid,
        // debug: true,
      }),
    ]),
  ];
  return tree;
}
