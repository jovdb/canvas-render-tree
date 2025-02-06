import './App.css';

import { loadResourcesAsync } from './resources';
import { IRenderItem } from './canvas';
import { Canvas } from './components/Canvas';
import { RenderTree } from './components/RenderTree';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { samples } from './samples';

function filterTree(
  items: readonly IRenderItem[] | undefined,
  selectedItems: readonly IRenderItem[]
) {
  const newItems: IRenderItem[] = [];

  items?.forEach((item) => {
    const children = filterTree(item.children, selectedItems);

    if (selectedItems.includes(item)) {
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
  const {
    data: resources,
    error,
    isFetching,
  } = useQuery({
    queryFn: () => loadResourcesAsync(),
    queryKey: ['init'],
  });

  // TODO: Show Tree, multiselect layers
  const [selectedItems, setSelectedItems] = useState<IRenderItem[]>([]);
  const [sampleKey, setSampleKey] = useState<keyof typeof samples>('cap');

  const tree = useMemo(() => {
    if (!resources) return undefined;
    const sample = samples[sampleKey];
    const tree = sample.tree(resources);

    return tree;
  }, [resources, sampleKey]);

  const selectedTree =
    tree && selectedItems.length ? filterTree(tree, selectedItems) : tree ?? [];

  return (
    <>
      Samples:{' '}
      <select
        value={sampleKey}
        onChange={(e) => {
          const sampleKey = e.target.value as keyof typeof samples;
          setSampleKey(sampleKey);
        }}
      >
        {Object.keys(samples).map((key) => (
          <option key={key} value={key}>
            {samples[key].name}
          </option>
        ))}
      </select>
      <hr />
      {error && `Error loading resources: ${error.message}`}
      <Canvas items={selectedTree ?? []} />
      {isFetching ? 'Loading...' : <br />}
      <hr />
      <div>
        <h3>Render tree (select items)</h3>
        <div style={{ display: 'flex' }}>
          <div>
            <RenderTree
              items={tree}
              selectedItems={selectedItems}
              onClick={(item) => {
                setSelectedItems((prev) => {
                  const has = prev.includes(item);
                  return has ? prev.filter((i) => i !== item) : [...prev, item];
                });
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
