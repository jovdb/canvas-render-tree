import { IRenderItem } from "../canvas";
import { RenderItem2 } from "./RenderItem2";

/** Indexes in tree */
export type TreeIndex = number[];

export function RenderTree2({
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
  return (
    <div className="render-tree">
      {items?.map((item, index) => (
        <RenderItem2
          key={`${item.name}-${index}`}
          item={item}
          treeIndex={[...parentIndexes, index]}
          editIndex={editIndex}
          selectedItems={selectedItems}
          visibleIndexes={visibleIndexes}
          onClick={onClick}
          onVisibilityChange={onVisibilityChange}
        />
      ))}
    </div>
  );
}
