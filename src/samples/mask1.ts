import { IRenderItem } from '../canvas';
import { operations } from '../operations';
import { IRenderResources } from '../resources';

export function mask1Tree(resources: IRenderResources) {
  const tree: IRenderItem[] = [
    operations.fillColor('red'),
    operations.drawImage({ image: resources.glassText }),
    operations.mask([operations.drawImage({ image: resources.text })]),
  ];
  return tree;
}
