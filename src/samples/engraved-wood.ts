import { RenderTree } from "../canvas";
import { operations } from "../operations";

import { availableImages } from "../resources";

export function engravedWoodTree() {
  const tree: RenderTree = [
    /*
    operations.drawImage({ imageUrl: availableImages.wood }),

    operations.layer([
      operations.drawImage({ imageUrl: availableImages.text }),
      operations.repaint([
        operations.layer([
          operations.drawImage({ imageUrl: availableImages.wood }),
          operations.fillColor("#0002"), // Make darker inside
          operations.blend("multiply", [
            operations.drawImage({ imageUrl: availableImages.noise }), // Add
          ]),
        ]),
      ]),
      operations.shadow({
        type: "inner",
        shadowBlur: 3,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        shadowColor: "#0008",
      }),
      operations.shadow({
        type: "inner",
        shadowBlur: 2,
        shadowOffsetX: -2,
        shadowOffsetY: -2,
        shadowColor: "#fff8",
      }),
    ]),
    */

    // Draw image behind text
    // operations.blend("destination-atop", [
    operations.drawImage({ imageUrl: availableImages.wood }),
    operations.shadow(
      {
        type: "inner",
        shadowBlur: 2,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowColor: "#0004",
      },
      [
        operations.shadow(
          {
            type: "inner",
            shadowBlur: 1,
            shadowOffsetX: -1,
            shadowOffsetY: -1,
            shadowColor: "#fff8",
          },
          [
            operations.drawImage({ imageUrl: availableImages.wood }),
            operations.fillColor("#0001"), // Make darker inside
            operations.blend("multiply", [
              operations.drawImage({ imageUrl: availableImages.noise }), // Add
            ]),
            operations.blend("destination-in", [
              operations.drawImage({ imageUrl: availableImages.text }),
            ]),
            //

            /*
        operations.layer([
          operations.drawImage({ imageUrl: availableImages.wood }),
          operations.fillColor('#0002'), // Make darker inside
          operations.blend('multiply', [
            operations.drawImage({ imageUrl: availableImages.noise }), // Add
          ]),
        ]),
        operations.mask([
          operations.drawImage({ imageUrl: availableImages.text }),
        ])
        */
            //]),
          ],
        ),
      ],
    ),
    // ]),
  ];
  return tree;
}

// export function engravedWoodTree(resources: IRenderResources) {
//   const tree: IRenderItem[] = [
//     operations.drawImage({ imageUrl: availableImages.wood }),
//     operations.shadow(
//       {
//         type: 'inner',
//         shadowBlur: 2,
//         shadowOffsetX: 3,
//         shadowOffsetY: 3,
//         shadowColor: '#0008',
//       },
//       [
//         operations.shadow(
//           {
//             type: 'inner',
//             shadowBlur: 1,
//             shadowOffsetX: -1,
//             shadowOffsetY: -1,
//             shadowColor: '#fff8',
//           },
//           [
//             operations.layer([
//               operations.drawImage({ imageUrl: availableImages.woodEngraved }),
//               operations.mask([
//                 operations.drawImage({ imageUrl: availableImages.text }),
//               ]),
//             ]),
//           ]
//         ),
//       ]
//     ),
//   ];
//   return tree;
// }
