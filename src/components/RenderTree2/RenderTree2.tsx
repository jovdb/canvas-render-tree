import { Fragment, useMemo, useState } from "react";
import { IRenderItem } from "../../canvas";
import { operations } from "../../operations";
import { availableImages } from "../../resources";
import { getSchema } from "../../schemas";
import { RenderItem2 } from "./RenderItem2";
import { AddOperationPopover } from "./AddOperationPopover";
import { useWorkTreeActions } from "../../stores/useWorkTreeStore";

/** Indexes in tree */
export type TreeIndex = number[];

export function RenderTree2({
  items,
  parentIndexes = [],
  selectedItems = [],
  visibleIndexes = [],
  editIndex,
  title,
  onClick,
  onDelete,
  onVisibilityChange,
}: {
  items: readonly IRenderItem[];
  parentIndexes?: TreeIndex;
  selectedItems?: readonly IRenderItem[];
  visibleIndexes: readonly TreeIndex[];
  editIndex?: TreeIndex | undefined;
  title: string | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
  onDelete?(item: IRenderItem, treeIndex: TreeIndex): void;
  onVisibilityChange?(item: IRenderItem, treeIndex: TreeIndex): void;
}) {
  const [addMenu, setAddMenu] = useState<
    { mode: "first" | "after"; index?: number } | undefined
  >();

  const { addItem } = useWorkTreeActions();

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
      case "shadow":
        return operations.shadow(
          {
            type: "outer",
            shadowBlur: 10,
            shadowOffsetX: 5,
            shadowOffsetY: 5,
            shadowColor: "#0008",
            onlyShadow: false,
          },
          [],
        );
      default:
        return (
          operations as Record<string, (...args: unknown[]) => IRenderItem>
        )[operationName]({});
    }
  }

  function onAddItem(operationName: string, index: number) {
    const newItem = createDefaultItem(operationName);
    addItem(items, newItem, index);
    setAddMenu(undefined); // Close menu
  }

  function renderAddMenu(mode: "first" | "after", index: number) {
    const isOpen = addMenu?.mode === mode && addMenu.index === index;

    return (
      <AddOperationPopover
        open={isOpen}
        onOpenChange={(open) => {
          setAddMenu(open ? { mode, index } : undefined);
        }}
        operations={operationOptions}
        onSelect={(operationName) => onAddItem(operationName, index)}
      />
    );
  }

  return (
    <div className="render-tree" title={title}>
      <div className="render-tree__buttons">{renderAddMenu("first", -1)}</div>
      {items?.reduceRight(
        (prevComponents, item, index) => {
          const newComponent = (
            <Fragment key={`${item.name}-${index}`}>
              <RenderItem2
                item={item}
                treeIndex={[...parentIndexes, index]}
                editIndex={editIndex}
                selectedItems={selectedItems}
                visibleIndexes={visibleIndexes}
                onClick={onClick}
                onDelete={onDelete}
                onVisibilityChange={onVisibilityChange}
              />
              <div className="render-tree__buttons">
                {renderAddMenu("after", index)}
              </div>
            </Fragment>
          );
          prevComponents.unshift(newComponent);
          return prevComponents;
        },
        [] as React.ReactNode[], // initial value
      )}
    </div>
  );
}
