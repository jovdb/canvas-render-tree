import { IRenderItem } from "../../canvas";
import { TreeIndex, RenderTree2 } from "./RenderTree2";
import "./RenderItem2.css";
import { EyeIcon } from "../../icons/eye";
import { EyeClosedIcon } from "../../icons/eye-closed";
import { getSchema } from "../../schemas";
import { useState } from "react";

export function RenderItem2({
  item,
  prevItems,
  selectedItems = [],
  visibleIndexes = [],
  treeIndex,
  editIndex,
  onClick,
  onDelete,
  onVisibilityChange,
  onTreeChange,
}: {
  item: IRenderItem;
  prevItems: readonly IRenderItem[];
  selectedItems?: readonly IRenderItem[];
  visibleIndexes?: readonly TreeIndex[];
  /** Tree index of this item */
  treeIndex: TreeIndex;
  /** Tree index of the item selected for editing */
  editIndex: TreeIndex | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
  onDelete?(item: IRenderItem, treeIndex: TreeIndex): void;
  onVisibilityChange?(item: IRenderItem, treeIndex: TreeIndex): void;
  onTreeChange?(newTree: IRenderItem[]): void;
}) {
  // const isSelected = selectedItems.includes(item);
  const isSelected = treeIndex.join() === editIndex?.join();
  const isVisible =
    !visibleIndexes?.length ||
    visibleIndexes.some(
      (visibleIndex) =>
        JSON.stringify(visibleIndex) === JSON.stringify(treeIndex),
    );
  const schema = getSchema(item.name);
  if (!schema) {
    console.warn(`No schema found for item name: ${item.name}`);
  }

  const [collapseInput, setCollapseInput] = useState(false);
  const name = schema?.getName ? schema.getName(item.config) : item.name;

  const inputs = schema?.input
    ? [
        ...(schema?.prevAsInput ? [prevItems] : []),
        ...(item.input ? [item.input] : []),
        ...(item.args ? item.args : []),
      ]
    : schema?.input?.required
      ? [undefined]
      : undefined;

  return (
    <>
      <div className="render-item__inputs">
        {inputs?.map((input, index) => (
          <div className="render-item__input">
            <div
              className={`render-item__group ${collapseInput ? "render-item__group--collapsed" : ""}`}
            >
              <RenderTree2
                items={input}
                selectedItems={selectedItems}
                visibleIndexes={visibleIndexes}
                parentIndexes={treeIndex}
                editIndex={editIndex}
                onClick={onClick}
                onDelete={onDelete}
                onVisibilityChange={onVisibilityChange}
                onTreeChange={(newTree) => {
                  const newItems = [
                    ...input.slice(0, index),
                    newTree,
                    ...input.slice(index + 1),
                  ];
                  onTreeChange?.(newItems);
                }}
              />
            </div>
            <div className="render-item__input-below">
              <span className="render-item__input-arrow">⇣</span>
              <span
                className="render-item__input-collapse"
                onClick={() => setCollapseInput(!collapseInput)}
              >
                {collapseInput ? "▲" : "▼"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="render-item__wrapper">
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
            {/*isVisible ? <EyeIcon size={16} /> : <EyeClosedIcon size={16} />*/}
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(item, treeIndex);
            }}
            className="render-item__name"
          >
            {name}
          </div>
        </div>
        <button
          className="render-item__del"
          onClick={() => onDelete?.(item, treeIndex)}
        >
          ⨯
        </button>
      </div>
    </>
  );
}
