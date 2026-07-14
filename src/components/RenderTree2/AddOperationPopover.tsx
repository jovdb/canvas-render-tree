import { Popover } from "@base-ui/react/popover";
import { useEffect, useState } from "react";

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
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open) setFilter("");
  }, [open]);

  const filteredOperations = filter.trim()
    ? operations.filter(({ operationName, description }) => {
        const query = filter.trim().toLowerCase();
        return (
          operationName.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query)
        );
      })
    : operations;

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger className="render-tree__add">+</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup className="render-tree__add-popup">
            <input
              type="text"
              className="render-tree__add-filter"
              placeholder="Search operations…"
              value={filter}
              autoFocus
              onChange={(e) => setFilter(e.target.value)}
            />
            {filteredOperations.map(({ operationName, description }) => (
              <button
                key={operationName}
                className="render-tree__add-option"
                onClick={() => onSelect(operationName)}
              >
                <span className="render-tree__add-option-title">
                  {operationName}
                </span>
                {description ? (
                  <span className="render-tree__add-option-description">
                    {description}
                  </span>
                ) : null}
              </button>
            ))}
            {filteredOperations.length === 0 ? (
              <span className="render-tree__add-empty">No matches</span>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
