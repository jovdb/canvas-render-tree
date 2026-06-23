import { IRenderItem } from "../canvas";
import { TreeIndex, RenderTree } from "./RenderTree";
import "./RenderItem.css";
import { EyeIcon } from "../icons/eye";
import { EyeClosedIcon } from "../icons/eye-closed";

export function RenderItem({
  item,
  selectedItems = [],
  visibleIndexes = [],
  treeIndex,
  editIndex,
  onClick,
  onVisibilityChange,
}: {
  item: IRenderItem;
  selectedItems?: readonly IRenderItem[];
  visibleIndexes?: readonly TreeIndex[];
  /** Tree index of this item */
  treeIndex: TreeIndex;
  /** Tree index of the item selected for editing */
  editIndex: TreeIndex | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
  onVisibilityChange?(item: IRenderItem, treeIndex: TreeIndex): void;
}) {
  // const isSelected = selectedItems.includes(item);
  const isSelected = treeIndex.join() === editIndex?.join();
  const isVisible =
    !visibleIndexes?.length ||
    visibleIndexes.some(
      (visibleIndex) =>
        JSON.stringify(visibleIndex) === JSON.stringify(treeIndex),
    );
  return (
    <>
      <div
        className={`render-item ${onClick ? "render-item--selectable" : ""} ${
          isSelected ? "render-item--selected" : ""
        }`}
        role="button"
        tabIndex={0}
      >
        <span
          className="render-item__visibility"
          onClick={() => {
            // e.stopPropagation();
            onVisibilityChange?.(item, treeIndex);
            onClick?.(item, treeIndex);
          }}
          role="button"
          tabIndex={0}
        >
          {isVisible ? <EyeIcon size={16} /> : <EyeClosedIcon size={16} />}
        </span>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(item, treeIndex);
          }}
          className="render-item__name"
          style={{ paddingLeft: (treeIndex.length - 1) * 10 }}
        >
          {item.name}
        </div>
      </div>
      <RenderTree
        items={item.children}
        selectedItems={selectedItems}
        visibleIndexes={visibleIndexes}
        parentIndexes={treeIndex}
        editIndex={editIndex}
        onClick={onClick}
        onVisibilityChange={onVisibilityChange}
      />
    </>
  );
}
