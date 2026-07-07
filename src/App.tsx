import "./App.css";

import { IRenderItem } from "./canvas";
import { AppOverlay } from "./components/AppOverlay";
import { Canvas } from "./components/Canvas";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import "./operations";
import "./operations/operations";

import { samples } from "./samples";
import { produce } from "immer";
import { RenderTreePanel } from "./components/RenderTreePanel";
import { TreeIndex } from "./components/RenderTree";
import { getRendererConfig, IConfig, JsonConfig } from "./configs";
import { RenderItemName } from "./operations";
import "./configs/load";
import { getRendererOverlay } from "./overlays";
import { useWorkTree, useWorkTreeActions } from "./stores/useWorkTreeStore";

export function selectIndex(tree: readonly IRenderItem[], index: TreeIndex) {
  if (index.length === 0) return undefined;
  if (index.length === 1) return tree[index[0]];

  const [nextIndex, ...restIndex] = index;
  const restTree = tree[nextIndex];
  const items = restTree?.args?.flatMap((arg) => arg ?? []) ?? [];
  if (!restTree || items.length === 0) return undefined;
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
    const childItems = item.args?.flatMap((arg) => arg ?? []) ?? [];
    const children = filterTree(childItems, visibleIndexes, treeIndex);

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
  const [editPanelWidth, setEditPanelWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  /** Working tree is a copy of the entire sample and can be modified */
  const workTree = useWorkTree();
  const { updateWorkTree, deleteItem } = useWorkTreeActions();

  const [sampleKey, setSampleKey] = useState<keyof typeof samples>("opacity");

  useEffect(() => {
    const sample = samples[sampleKey];
    const tree = sample?.tree() ?? [];
    updateWorkTree(() => tree);
    setEditIndex([]);
    setVisibleIndexes([]);
  }, [updateWorkTree, sampleKey]);

  /** The items to render, workTree with selection filter */
  const renderTree = useMemo(() => {
    return workTree && visibleIndexes.length
      ? filterTree(workTree, visibleIndexes)
      : (workTree ?? []);
  }, [workTree, visibleIndexes]);
  const deferredRenderTree = useDeferredValue(renderTree);
  // console.log(JSON.stringify(renderTree, null, 2));

  // Configurator
  const editItem = selectIndex(workTree, editIndex ?? []);
  const renderItemName = editItem?.name as RenderItemName | undefined;
  const ItemConfigurator = getRendererConfig(renderItemName) || (() => null);

  const RendererOverlay = getRendererOverlay(renderItemName);

  const [_isPending, startTransition] = useTransition();
  const onConfigChange = (mutate: (config: IConfig) => void) => {
    const newTree = produce(workTree, (draftTree) => {
      const item = selectIndex(draftTree, editIndex ?? []);
      const cfg = item?.config;
      if (cfg) mutate(cfg);
    });
    startTransition(() => updateWorkTree(() => newTree));
  };

  const sampleGroups = Object.values(samples)
    .map((sample) => sample.type)
    .filter((value, index, self) => self.indexOf(value) === index);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (event: MouseEvent) => {
      const nextWidth = Math.min(
        520,
        Math.max(220, window.innerWidth - event.clientX),
      );
      setEditPanelWidth(nextWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

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
          {sampleGroups.map((group) => (
            <optgroup label={group} key={group}>
              {Object.keys(samples)
                .filter(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (key) => (samples as any)[key]?.type === group,
                )
                .map((key) => {
                  return (
                    <option key={key} value={key}>
                      {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ((samples as any)[key] as unknown as IRenderItem).name
                      }
                    </option>
                  );
                })}
            </optgroup>
          ))}
        </select>
        <br />
        <div className="app__canvas">
          <Canvas items={deferredRenderTree ?? []} />
          <AppOverlay>
            {RendererOverlay && (
              <RendererOverlay
                config={editItem?.config ?? {}}
                mutateConfig={onConfigChange}
              />
            )}
          </AppOverlay>
        </div>
      </div>

      <div
        className="app__resize-handle"
        role="separator"
        aria-orientation="vertical"
        onMouseDown={(event) => {
          event.preventDefault();
          setIsResizing(true);
        }}
      />
      <div className="app__edit-panel" style={{ width: editPanelWidth }}>
        <div className="app__render-tree">
          <RenderTreePanel
            items={workTree}
            editIndex={editIndex}
            visibleIndexes={visibleIndexes}
            onClick={(_item, treeIndex) => {
              setEditIndex(treeIndex);
            }}
            onDelete={(_item, treeIndex) => {
              deleteItem(treeIndex);
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
            onTreeChange={(newTree) => {
              updateWorkTree(() => newTree);
              console.log("New tree:", JSON.stringify(newTree, null, 2));
            }}
          />
        </div>
        <div className="app__render-item-details">
          <h3>Details</h3>
          <ItemConfigurator
            config={editItem?.config as IRenderItem<IConfig>}
            mutateConfig={onConfigChange}
          />
        </div>
        <div className="app__render-item-json">
          <h3>JSON</h3>
          {editItem && (
            <JsonConfig
              key={JSON.stringify(editItem?.config)}
              config={editItem?.config as IRenderItem<IConfig>}
              mutateConfig={onConfigChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
