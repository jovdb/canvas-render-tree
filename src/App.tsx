import "./App.css";

import { IRenderItem, OperationSchema } from "./canvas";
import { Canvas } from "./components/Canvas";
import { useEffect, useMemo, useState, useTransition } from "react";
import { samples } from "./samples";
import { produce } from "immer";
import { RenderTreePanel } from "./components/RenderTreePanel";
import { TreeIndex } from "./components/RenderTree";
import { getRendererConfig } from "./configs";
import { RenderItemName } from "./operations";
import "./configs/load";
import { schemas } from "./shemas";

export function selectIndex(tree: IRenderItem[], index: TreeIndex) {
  if (index.length === 0) return undefined;
  if (index.length === 1) return tree[index[0]];

  const [nextIndex, ...restIndex] = index;
  const restTree = tree[nextIndex];
  const items = [
    ...(restTree.args ? restTree.args.flat() : []),
    ...(restTree.input ? restTree.input : []),
  ];
  if (!restTree || !items) return undefined;
  return selectIndex(items, restIndex);
}

function filterTree(
  items: readonly IRenderItem[] | undefined,
  visibleIndexes: readonly TreeIndex[],
  parentTreeIndexes: TreeIndex = [],
) {
  const newItems: IRenderItem[] = [];

  items?.forEach((item, index) => {
    const treeIndex = [...parentTreeIndexes, index];
    const items = [
      ...(item.args ? item.args.flat() : []),
      ...(item.input ? item.input : []),
    ];
    const children = filterTree(items, visibleIndexes, treeIndex);

    if (
      visibleIndexes.some(
        (visibleTreeIndex) =>
          JSON.stringify(visibleTreeIndex) === JSON.stringify(treeIndex),
      )
    ) {
      const clonedItem = {
        ...item,
        children,
      };
      newItems.push(clonedItem);
    } else {
      newItems.push(...children);
    }
  });
  return newItems;
}

function App() {
  const [editIndex, setEditIndex] = useState<TreeIndex | undefined>();
  const [visibleIndexes, setVisibleIndexes] = useState<TreeIndex[]>([]);
  const [sampleKey, setSampleKey] = useState<keyof typeof samples>("glass");

  /** Working tree is a copy of the entire sample and can be modified */
  const [workTree, setWorkTree] = useState<IRenderItem[]>([]);

  useEffect(() => {
    const sample = samples[sampleKey];
    const tree = sample.tree();

    // Reset
    setWorkTree(tree);
    setEditIndex([]);
    setVisibleIndexes([]);
  }, [sampleKey]);

  /** The items to render, workTree with selection filter */
  const renderTree =
    workTree && visibleIndexes.length
      ? filterTree(workTree, visibleIndexes)
      : (workTree ?? []);
  // console.log(JSON.stringify(renderTree, null, 2));

  // Configurator
  const editItem = selectIndex(workTree, editIndex ?? []);
  const renderItemName = editItem?.name as RenderItemName | undefined;
  const ItemConfigurator = getRendererConfig(renderItemName) || (() => null);

  const [_isPending, startTransition] = useTransition();
  const onConfigChange = (mutate: (config: unknown) => void) => {
    const newTree = produce(workTree, (draftTree) => {
      const item = selectIndex(draftTree, editIndex ?? []);
      mutate(item?.config);
    });
    startTransition(() => setWorkTree(newTree));
  };

  const schema = useMemo(() => {
    if (!editItem) return undefined;
    return (schemas as unknown as any)[editItem.name] as
      | OperationSchema<RenderItemName>
      | undefined;
  }, [editItem]);

  return (
    <div className="app">
      <div className="app__preview">
        Samples:{" "}
        <select
          value={sampleKey}
          onChange={(e) => {
            const sampleKey = e.target.value as keyof typeof samples;
            setSampleKey(sampleKey);
          }}
          style={{ marginBottom: "1rem" }}
        >
          {Object.keys(samples).map((key) => (
            <option key={key} value={key}>
              {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((samples as any)[key] as unknown as IRenderItem).name
              }
            </option>
          ))}
        </select>
        <br />
        <Canvas items={renderTree ?? []} />
      </div>

      <div className="app__edit-panel">
        <div className="app__render-tree">
          <RenderTreePanel
            items={workTree}
            editIndex={editIndex}
            visibleIndexes={visibleIndexes}
            onClick={(_item, treeIndex) => {
              setEditIndex(treeIndex);
            }}
            onVisibilityChange={(_item, treeIndex) => {
              setVisibleIndexes((prev) => {
                const treeItemSTring = JSON.stringify(treeIndex);
                const isSelected = prev.some(
                  (treeIndex) => JSON.stringify(treeIndex) === treeItemSTring,
                );
                if (isSelected) {
                  return prev.filter(
                    (treeIndex) => JSON.stringify(treeIndex) !== treeItemSTring,
                  );
                } else {
                  return [...prev, treeIndex];
                }
              });
            }}
          />
        </div>
        <div className="app__render-item-info">
          <h3>Info</h3>
          {schema?.description && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Description:</strong> {schema?.description}
            </div>
          )}
        </div>
        <div className="app__render-item-details">
          <h3>Details</h3>
          <ItemConfigurator
            config={editItem?.config as IRenderItem<unknown>}
            mutateConfig={onConfigChange}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
