import React from "react";
import { IRenderItem } from "../../canvas";
import { operations } from "../../operations";
import { availableImages } from "../../resources";
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
  onDelete,
  onVisibilityChange,
  onTreeChange,
}: {
  items: readonly IRenderItem[] | undefined;
  parentIndexes?: TreeIndex;
  selectedItems?: readonly IRenderItem[];
  visibleIndexes: readonly TreeIndex[];
  editIndex?: TreeIndex | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
  onDelete?(item: IRenderItem, treeIndex: TreeIndex): void;
  onVisibilityChange?(item: IRenderItem, treeIndex: TreeIndex): void;
  onTreeChange?(newTree: IRenderItem[]): void;
}) {
  function onAddFirst() {
    const newItems = [
      operations.drawImage({
        imageUrl: availableImages.parrot,
      }),
      ...(items ?? []),
    ];
    onTreeChange?.(newItems);
  }

  function onAddAfter(index: number) {
    debugger;
    const newItem = operations.drawImage({
      imageUrl: availableImages.parrot,
    });
    const newItems = [...(items ?? [])];
    newItems.splice(index + 1, 0, newItem);
    onTreeChange?.(newItems);
  }

  return (
    <div className="render-tree">
      <div className="render-tree__buttons">
        <button className="render-tree__add" onClick={onAddFirst}>
          +
        </button>
      </div>
      {items?.map((item, index) => (
        <React.Fragment key={`${item.name}-${index}`}>
          <RenderItem2
            item={item}
            prevItems={items.slice(0, index)}
            treeIndex={[...parentIndexes, index]}
            editIndex={editIndex}
            selectedItems={selectedItems}
            visibleIndexes={visibleIndexes}
            onClick={onClick}
            onDelete={onDelete}
            onVisibilityChange={onVisibilityChange}
            onTreeChange={(newItem) => {
              const newItems = [...(items ?? [])];
              newItems[index].input = newItem;
              onTreeChange?.(newItems);
            }}
          />
          <div className="render-tree__buttons">
            <button
              className="render-tree__add"
              onClick={() => onAddAfter(index)}
            >
              +
            </button>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
