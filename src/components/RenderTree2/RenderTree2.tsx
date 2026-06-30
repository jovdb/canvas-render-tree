import { Fragment, useMemo, useState } from "react";
import { IRenderItem } from "../../canvas";
import { operations } from "../../operations";
import { availableImages } from "../../resources";
import { getSchema } from "../../schemas";
import { RenderItem2 } from "./RenderItem2";
import { AddOperationPopover } from "./AddOperationPopover";

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
  const [addMenu, setAddMenu] = useState<
    | { mode: "first" | "after"; index?: number }
    | undefined
  >();

  const operationOptions = useMemo(
    () =>
      Object.keys(operations)
        .sort()
        .map((operationName) => ({
          operationName,
          description: getSchema(operationName)?.description ?? "",
        })),
    [],
  );

  function createDefaultItem(operationName: string): IRenderItem {
    switch (operationName) {
      case "drawImage":
        return operations.drawImage({ imageUrl: availableImages.parrot });
      case "opacity":
        return operations.opacity(1);
      case "blend":
        return operations.blend("source-over");
      case "shadow":
        return operations.shadow({
          type: "outer",
          shadowBlur: 10,
          shadowOffsetX: 5,
          shadowOffsetY: 5,
          shadowColor: "#0008",
          onlyShadow: false,
        });
      default:
        return (operations as Record<string, (...args: unknown[]) => IRenderItem>)[
          operationName
        ]({});
    }
  }

  function addItem(operationName: string, index?: number) {
    const newItem = createDefaultItem(operationName);
    const newItems = [...(items ?? [])];

    if (typeof index === "number") {
      newItems.splice(index + 1, 0, newItem);
    } else {
      newItems.unshift(newItem);
    }

    onTreeChange?.(newItems);
    setAddMenu(undefined);
  }

  function renderAddMenu(mode: "first" | "after", index?: number) {
    const isOpen = addMenu?.mode === mode && addMenu.index === index;

    return (
      <AddOperationPopover
        open={isOpen}
        onOpenChange={(open) => {
          setAddMenu(open ? { mode, index } : undefined);
        }}
        operations={operationOptions}
        onSelect={(operationName) => addItem(operationName, index)}
      />
    );
  }

  return (
    <div className="render-tree">
      <div className="render-tree__buttons">{renderAddMenu("first")}</div>
      {items?.map((item, index) => (
        <Fragment key={`${item.name}-${index}`}>
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
              // TODO: What if doesn't support input according to schema
              newItems[index].input = newItem;
              onTreeChange?.(newItems);
            }}
          />
          <div className="render-tree__buttons">{renderAddMenu("after", index)}</div>
        </Fragment>
      ))}
    </div>
  );
}
