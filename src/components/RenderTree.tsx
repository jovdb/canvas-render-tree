import { IRenderItem } from "../canvas";
import "./RenderTree.css";

/** Indexes in tree */
export type TreeIndex = number[];

export function RenderTree({
  items,
  parentIndexes = [],
  selectedItems = [],
  editIndex,
  onClick,
}: {
  items: readonly IRenderItem[] | undefined;
  parentIndexes?: TreeIndex;
  selectedItems?: readonly IRenderItem[];
  editIndex?: TreeIndex | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
}) {
  return items?.map((item, index) => (
    <RenderItem
      key={`${item.name}-${index}`}
      item={item}
      onClick={onClick}
      treeIndex={[...parentIndexes, index]}
      editIndex={editIndex}
      selectedItems={selectedItems}
    />
  ));
}

export function RenderItem({
  item,
  selectedItems = [],
  treeIndex,
  editIndex,
  onClick,
}: {
  item: IRenderItem;
  selectedItems?: readonly IRenderItem[];
  /** Tree index of this item */
  treeIndex: TreeIndex;
  /** Tree index of the item selected for editing */
  editIndex: TreeIndex | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
}) {
  // const isSelected = selectedItems.includes(item);
  const isSelected = treeIndex.join() === editIndex?.join();

  return (
    <>
      <div
        className={`render-item ${onClick ? "render-item--selectable" : ""} ${
          isSelected ? "render-item--selected" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(item, treeIndex);
        }}
      >
        <div style={{ paddingLeft: (treeIndex.length - 1) * 10 }}>
          {item.name}
        </div>
      </div>
      <RenderTree
        items={item.children}
        selectedItems={selectedItems}
        parentIndexes={treeIndex}
        editIndex={editIndex}
        onClick={onClick}
      />
    </>
  );
}
