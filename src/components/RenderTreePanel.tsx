import { IRenderItem } from "../canvas";
import { RenderTree, TreeIndex } from "./RenderTree";

interface RenderTreePanelProps {
  items: IRenderItem[];
  editIndex: TreeIndex | undefined;
  onClick?(item: IRenderItem, treeIndex: TreeIndex): void;
}

export function RenderTreePanel({
  items,
  editIndex,
  onClick,
}: RenderTreePanelProps) {
  function onSave() {
    console.log(JSON.stringify(items, undefined, 2));
  }
  return (
    <>
      <button onClick={onSave}>Save</button>
      <h3>Render tree (select items)</h3>
      <div
        onKeyDown={(e) => {
          const key = e.key;
          const divEl = e.currentTarget as HTMLDivElement;
          const items = [
            ...divEl.querySelectorAll(".render-item"),
          ] as HTMLDivElement[];
          const item = e.target as HTMLDivElement;
          const index = items.indexOf(item);
          if (index === -1) return;

          let selectEl: HTMLDivElement | undefined = undefined;
          if (key === "ArrowUp") {
            selectEl = items[index - 1];
          } else if (key === "ArrowDown") {
            selectEl = items[index + 1];
          }

          if (selectEl) {
            selectEl.focus();
            selectEl.click();
            selectEl.scrollIntoView({ block: "nearest" });
            e.preventDefault();
          }
        }}
      >
        <RenderTree
          items={items}
          parentIndexes={[]}
          editIndex={editIndex}
          onClick={onClick}
        />
      </div>
    </>
  );
}
