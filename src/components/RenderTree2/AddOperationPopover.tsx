import { Popover } from "@base-ui/react/popover";

export function AddOperationPopover({
  open,
  onOpenChange,
  operations,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operations: Array<{ operationName: string; description: string }>;
  onSelect: (operationName: string) => void;
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger className="render-tree__add">+</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup className="render-tree__add-popup">
            {operations.map(({ operationName, description }) => (
              <button
                key={operationName}
                className="render-tree__add-option"
                onClick={() => onSelect(operationName)}
              >
                <span className="render-tree__add-option-title">{operationName}</span>
                {description ? (
                  <span className="render-tree__add-option-description">
                    {description}
                  </span>
                ) : null}
              </button>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
