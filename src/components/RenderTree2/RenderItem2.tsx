import { IRenderItem } from "../../canvas";
import { TreeIndex, RenderTree2, isWithinTree } from "./RenderTree2";
import "./RenderItem2.css";
import { getSchema } from "../../schemas";
import { useState } from "react";
import { setDraggedItem } from "./dragState";
import { TargetIcon } from "../../icons/target";

export function RenderItem2({
  item,
  selectedItems = [],
  visibleIndexes = [],
  treeIndex,
  editIndex,
  soloIndex,
  onClick,
  onDelete,
  onVisibilityChange,
  onSoloChange,
  onMove,
}: {
  item: IRenderItem;
  selectedItems?: readonly IRenderItem[];
  visibleIndexes?: readonly TreeIndex[];
  /** Tree index of this item */
  treeIndex: TreeIndex;
  /** Tree index of the item selected for editing */
  editIndex: TreeIndex | undefined;
  /** Tree index of the item that is currently "solo'd" (only it + its inputs are rendered) */
  soloIndex?: TreeIndex | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
  onDelete?(item: IRenderItem, treeIndex: TreeIndex): void;
  onVisibilityChange?(item: IRenderItem, treeIndex: TreeIndex): void;
  onSoloChange?(item: IRenderItem, treeIndex: TreeIndex): void;
  onMove?(
    item: IRenderItem,
    targetTree: readonly IRenderItem[],
    atIndex: number,
  ): void;
}) {
  // const isSelected = selectedItems.includes(item);
  const isSelected = treeIndex.join() === editIndex?.join();
  const isSolo = treeIndex.join() === soloIndex?.join();
  const isDisabled =
    soloIndex !== undefined && !isWithinTree(treeIndex, soloIndex);
  const schema = getSchema(item.name);
  if (!schema) {
    console.warn(`No schema found for item name: ${item.name}`);
  }

  const [collapseInput, setCollapseInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
                items={arg ?? []}
                selectedItems={selectedItems}
                visibleIndexes={visibleIndexes}
                parentIndexes={treeIndex}
                editIndex={editIndex}
                soloIndex={soloIndex}
                onClick={onClick}
                onDelete={onDelete}
                onVisibilityChange={onVisibilityChange}
                onSoloChange={onSoloChange}
                onMove={onMove}
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
          } ${isDragging ? "render-item--dragging" : ""} ${
            isDisabled ? "render-item--disabled" : ""
          }`}
          role="button"
          tabIndex={0}
          title={schema?.description}
          draggable={!!onMove}
          onDragStart={(e) => {
            setDraggedItem(item);
            setIsDragging(true);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item.name);
          }}
          onDragEnd={() => {
            setDraggedItem(undefined);
            setIsDragging(false);
          }}
        >
          <button
            type="button"
            className={`render-item__solo ${isSolo ? "render-item__solo--active" : ""}`}
            title={
              isSolo
                ? "Show full render tree"
                : "Solo: only render this item and its inputs"
            }
            aria-pressed={isSolo}
            onClick={(e) => {
              e.stopPropagation();
              onSoloChange?.(item, treeIndex);
            }}
          >
            <TargetIcon size={14} />
          </button>
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
