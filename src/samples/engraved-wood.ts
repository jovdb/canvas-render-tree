import { IRenderItem } from '../canvas';
import { operations } from '../operations';

import { IRenderResources } from '../resources';

export function engravedWoodTree(resources: IRenderResources) {
  const tree: IRenderItem[] = [
    operations.drawImage({ image: resources.wood }),

    operations.layer([
      operations.drawImage({ image: resources.text }),
      operations.repaint([
        operations.layer([
          operations.drawImage({ image: resources.wood }),
          operations.fillColor('#0002'), // Make darker inside
          operations.blend('multiply', [
            operations.drawImage({ image: resources.noise }), // Add
          ]),
        ]),
      ]),
      operations.shadow({
        type: 'inner',
        shadowBlur: 3,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
        shadowColor: '#0008',
      }),
      operations.shadow({
        type: 'inner',
        shadowBlur: 2,
        shadowOffsetX: -2,
        shadowOffsetY: -2,
        shadowColor: '#fff8',
      }),
    ]),
    /*
      operations.layer([
        operations.drawImage({ image: resources.wood }),
        operations.fillColor('#0002'), // Make darker inside
        operations.blend('multiply', [
          operations.drawImage({ image: resources.noise }), // Add
        ]),
      ]),
      operations.mask([
        operations.drawImage({ image: resources.text }),
      ])
      */
    //]),
  ];
  return tree;
}

// export function engravedWoodTree(resources: IRenderResources) {
//   const tree: IRenderItem[] = [
//     operations.drawImage({ image: resources.wood }),
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
//               operations.drawImage({ image: resources.woodEngraved }),
//               operations.mask([
//                 operations.drawImage({ image: resources.text }),
//               ]),
//             ]),
//           ]
//         ),
//       ]
//     ),
//   ];
//   return tree;
// }
