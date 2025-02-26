import { uvMap } from "./operations/uv-map";

export function loadImageAsync(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = document.createElement("img");
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
  return {
    parrot: await loadImageAsync("./parrot.png"),
    wood: await loadImageAsync("./hout.jpg"),
    woodEngraved: await loadImageAsync("./hout-engraved.jpg"),
    noise: await loadImageAsync("./noise.jpg"),
    glass: await loadImageAsync("./glass.jpg"),
    glassText: await loadImageAsync("./glass-text.png"),
    text: await loadImageAsync("./text.png"),
    gold: await loadImageAsync("gold.jpg"),
    goldBack: await loadImageAsync("foil-back.jpg"),
    goldFoil: await loadImageAsync("foil-layer2.png"),
    cap: await loadImageAsync("cap.jpg"),
    displacementMap1: await loadImageAsync("displacement-map1.png"),
    displacementMap2: await loadImageAsync("displacement-map2.png"),
    homer: await loadImageAsync("homer.png"),
    checkerboard: await loadImageAsync("checkerboard.png"),
    uvMap: await loadImageAsync("uv-map.png"),
  };
}

export type IRenderResources = Awaited<ReturnType<typeof loadResourcesAsync>>;
