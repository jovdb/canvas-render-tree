import { IRenderItem } from '../canvas';
import { operations } from '../operations';
import { IRenderResources } from '../resources';

export function engravedGlassTree(resources: IRenderResources) {
  const tree: IRenderItem[] = [
    operations.drawImage({ image: resources.glass }),
    operations.layer([
      operations.drawImage({ image: resources.noise }),
      operations.fillColor('#0001'), // make a bit darker
      operations.mask([operations.drawImage({ image: resources.glassText })]),
    ]),
    operations.shadow({
      type: 'inner',
      shadowBlur: 2,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowColor: '#0003',
    }),
  ];
  return tree;
}
