import { IRenderItem } from '../canvas';
import { operations } from '../operations';
import { IRenderResources } from '../resources';

export function goldFoilTree(resources: IRenderResources) {
  const tree: IRenderItem[] = [
    operations.drawImage({ image: resources.goldBack }),

    operations.layer([
      operations.drawImage({ image: resources.gold }),
      operations.mask([operations.drawImage({ image: resources.goldFoil })]),
    ]),

    operations.shadow({
      type: 'inner',
      shadowBlur: 3,
      shadowOffsetX: -2,
      shadowOffsetY: -2,
      shadowColor: '#0003',
    }),

    operations.shadow({
      type: 'inner',
      shadowBlur: 3,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: '#fff2',
    }),
  ];

  return tree;
}
