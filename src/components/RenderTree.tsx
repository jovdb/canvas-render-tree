import { IRenderItem } from "../canvas";
import { RenderItem } from "./RenderItem";

/** Indexes in tree */
export type TreeIndex = number[];

export function RenderTree({
  items,
  parentIndexes = [],
  selectedItems = [],
  visibleIndexes = [],
  editIndex,
  onClick,
  onVisibilityChange,
}: {
  items: readonly IRenderItem[] | undefined;
  parentIndexes?: TreeIndex;
  selectedItems?: readonly IRenderItem[];
  visibleIndexes: readonly TreeIndex[];
  editIndex?: TreeIndex | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
  onVisibilityChange?(item: IRenderItem, treeIndex: TreeIndex): void;
}) {
  return items?.map((item, index) => (
    <RenderItem
      key={`${item.name}-${index}`}
      item={item}
      treeIndex={[...parentIndexes, index]}
      editIndex={editIndex}
      selectedItems={selectedItems}
      visibleIndexes={visibleIndexes}
      onClick={onClick}
      onVisibilityChange={onVisibilityChange}
    />
  ));
}
