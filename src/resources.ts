export function loadImageAsync(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = document.createElement('img');
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(`Error loading image: '${url ? url.substring(0, 100) : url}'`)
      );
    image.onabort = () =>
      reject(
        new Error(
          `Loading image aborted: '${url ? url.substring(0, 100) : url}'`
        )
      );
    image.src = url;
  });
}

export async function loadResourcesAsync() {
  const woodPromise = loadImageAsync('./hout.jpg');
  const woodEngravedPromise = loadImageAsync('./hout-engraved.jpg');

  const noisePromise = loadImageAsync('./noise.jpg');
  const glassPromise = loadImageAsync('./glass.jpg');
  const glassTextPromise = loadImageAsync('./glass-text.png');

  const goldPromise = loadImageAsync('gold.jpg');
  const goldBackPromise = loadImageAsync('foil-back.jpg');
  const goldFoilPromise = loadImageAsync('foil-layer2.png');
  const capPromise = loadImageAsync('cap.jpg');

  return {
    wood: await woodPromise,
    woodEngraved: await woodEngravedPromise,
    noise: await noisePromise,
    glass: await glassPromise,
    glassText: await glassTextPromise,
    text: await loadImageAsync('./text.png'),
    gold: await goldPromise,
    goldBack: await goldBackPromise,
    goldFoil: await goldFoilPromise,
    cap: await capPromise,
  };
}

export type IRenderResources = Awaited<ReturnType<typeof loadResourcesAsync>>;
