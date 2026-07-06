import { IRenderItem } from "../../canvas";
import { TreeIndex, RenderTree2 } from "./RenderTree2";
import "./RenderItem2.css";
import { getSchema } from "../../schemas";
import { useState } from "react";

export function RenderItem2({
  item,
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
  const schema = getSchema(item.name);
  if (!schema) {
    console.warn(`No schema found for item name: ${item.name}`);
  }

  const [collapseInput, setCollapseInput] = useState(false);
  const name = schema?.getName ? schema.getName(item.config) : item.name;

  const inputs: Array<readonly IRenderItem[] | undefined> = [
    ...(item.args ? item.args : []),
  ];

  const argNames = [
    ...(schema?.args?.map((arg) => arg.description ?? "") ?? []),
  ];

  return (
    <>
      <div className="render-item__inputs">
        {inputs?.map((arg, index) => (
          <div className="render-item__input" key={index}>
            <div
              className={`render-item__group ${collapseInput ? "render-item__group--collapsed" : ""}`}
            >
              <RenderTree2
                items={arg}
                selectedItems={selectedItems}
                visibleIndexes={visibleIndexes}
                parentIndexes={treeIndex}
                editIndex={editIndex}
                onClick={onClick}
                onDelete={onDelete}
                onVisibilityChange={onVisibilityChange}
                onTreeChange={(newTree) => {
                  const newItems = [
                    ...(arg ?? []).slice(0, index),
                    ...(Array.isArray(newTree) ? newTree : [newTree]),
                    ...(arg ?? []).slice(index + 1),
                  ];
                  onTreeChange?.(newItems);
                }}
                title={`${
                  schema?.args?.at(index)?.description ||
                  (schema?.name ? `Input for '${schema.name}'` : "") ||
                  `Input for ${item.name}`
                } `}
              />
            </div>
            <div className="render-item__input-below">
              <span
                className="render-item__input-arrow"
                title={argNames?.[index]}
              >
                ⇣
              </span>
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
          title={schema?.description}
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
