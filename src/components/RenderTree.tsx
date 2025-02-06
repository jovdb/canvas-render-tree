import { IRenderItem } from '../canvas';
import './RenderTree.css';

export function RenderTree({
  items,
  indentLevel = 0,
  selectedItems = [],
  onClick,
}: {
  items: readonly IRenderItem[] | undefined;
  indentLevel?: number;
  selectedItems?: readonly IRenderItem[];
  onClick?(item: IRenderItem): void;
}) {
  return items?.map((item, index) => (
    <RenderItem
      key={`${item.name}-${index}`}
      item={item}
      indentLevel={indentLevel}
      onClick={onClick}
      selectedItems={selectedItems}
    />
  ));
}

export function RenderItem({
  item,
  indentLevel = 0,
  selectedItems = [],
  onClick,
}: {
  item: IRenderItem;
  indentLevel?: number;
  selectedItems?: readonly IRenderItem[];
  onClick?(item: IRenderItem): void;
}) {
  const isSelected = selectedItems.includes(item);
  return (
    <>
      <div
        className={`render-item ${onClick ? 'render-item--selectable' : ''} ${
          isSelected ? 'render-item--selected' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(item);
        }}
      >
        <div style={{ paddingLeft: indentLevel * 10 }}>{item.name}</div>
      </div>
      <RenderTree
        items={item.children}
        indentLevel={indentLevel + 1}
        selectedItems={selectedItems}
        onClick={onClick}
      />
    </>
  );
}
