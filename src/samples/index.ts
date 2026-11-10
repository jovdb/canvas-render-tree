import { operations } from "../operations";
import { availableImages } from "../resources";
import { beierNeelyTree } from "./beier-neely";
import { bevel1Tree } from "./bevel";
import { bicubicGridTree } from "./bicubic-grid";
import { capTree } from "./cap";
import { catmullRomTree, catmullRomShirtTree } from "./catmull-rom";
import { convolutionSamplesTree } from "./convolution-kernel";
import { displacementTree } from "./displacement";
import { engravedGlassTree } from "./engraved-glass";
import { engravedWoodTree } from "./engraved-wood";
import { goldFoilTree } from "./gold-foil";
import { opacityTree } from "./opacity";
import { perspectiveTree } from "./perspective";
import { pillowTree } from "./pillow";
import { pillow2Tree } from "./pillow2";
import { shadowTree } from "./shadow";
import { bSplinePointsTree } from "./spline-points";
import { thinPlateSpines } from "./thin-plate-splines";
import { uvTree } from "./uv";

export const samples = {
  empty: {
    name: "Empty",
    type: "2d",
    tree: () => [],
  },
  opacity: {
    name: "Opacity",
    type: "2d",
    tree: opacityTree,
  },
  shadow: {
    name: "Shadow",
    type: "2d",
    tree: shadowTree,
  },
  blend: {
    name: "Blend",
    type: "2d",
    tree: () => [
      operations.drawImage({ imageUrl: availableImages.parrot }),
      operations.blend(
        "xor",
        [operations.drawImage({ imageUrl: availableImages.testbeeld })],
        [operations.drawImage({ imageUrl: availableImages.homer })],
      ),
    ],
  },
  raise: {
    name: "Raise",
    type: "2d",
    tree: () => [
      operations.drawImage({ imageUrl: availableImages.testbeeld }),
      operations.raise({ strength: 1 }, [
        operations.drawImage({ imageUrl: availableImages.homer }),
      ]),
    ],
  },
  gold: {
    name: "Gold foil",
    type: "2d",
    tree: goldFoilTree,
  },
  bevel: {
    name: "Bevel",
    type: "2d",
    tree: bevel1Tree,
  },
  convolution: {
    name: "Convolution Kernel",
    type: "2d",
    tree: convolutionSamplesTree,
  },
  // meshWarp: {
  //   name: "Mesh Warp",
  //   tree: meshWarpTree,
  // },
  perspective: {
    name: "Perspective",
    type: "3d",
    tree: perspectiveTree,
  },
  bicubicGrid: {
    name: "Bicubic Grid",
    type: "3d",
    tree: bicubicGridTree,
  },
  bSplinePoints: {
    name: "B-Spline Points",
    type: "3d",
    tree: bSplinePointsTree,
  },
  catmullRom: {
    name: "Catmull-Rom",
    type: "3d",
    tree: catmullRomTree,
  },
  catmullRomShirt: {
    name: "Catmull-Rom Shirt",
    type: "lifestyle",
    tree: catmullRomShirtTree,
  },
  thinPlatesSplines: {
    name: "thinPlatesSplines",
    type: "3d",
    tree: thinPlateSpines,
  },
  beierNeely: {
    name: "Beier-Neely",
    type: "3d",
    tree: beierNeelyTree,
  },
  displacement: {
    name: "Displacement Map",
    type: "3d",
    tree: displacementTree,
  },
  uv: {
    name: "UV Map",
    type: "3d",
    tree: uvTree,
  },
  wood: {
    name: "Engraved wood",
    type: "lifestyle",
    tree: engravedWoodTree,
  },
  glass: {
    name: "Engraved glass",
    type: "lifestyle",
    tree: engravedGlassTree,
  },
  cap: {
    name: "Cap",
    type: "lifestyle",
    tree: capTree,
  },
  pillow: {
    name: "Pillow (bicubic)",
    type: "lifestyle",
    tree: pillowTree,
  },
  pillow2: {
    name: "Pillow 2",
    type: "lifestyle",
    tree: pillow2Tree,
  },
  drawImage: {
    name: "Draw Image",
    type: "2d",
    tree: () => [operations.drawImage({ imageUrl: availableImages.homer })],
  },
  fillColor: {
    name: "Fill Color",
    type: "2d",
    tree: () => [operations.fillColor({ color: "#f5f5f5" })],
  },
  drawText: {
    name: "Draw Text",
    type: "2d",
    tree: () => [operations.drawText({ text: "Hello", x: 24, y: 48 })],
  },
  mask: {
    name: "Mask",
    type: "2d",
    tree: () => [
      operations.mask(
        {
          maskSource: "green",
        },
        [operations.drawImage({ imageUrl: availableImages.parrot })],
        [operations.drawImage({ imageUrl: availableImages.mask })],
      ),
    ],
  },

  blur: {
    name: "Blur",
    type: "2d",
    tree: () => [
      operations.blur({}, [
        operations.drawImage({ imageUrl: availableImages.homer }),
      ]),
    ],
  },
  saturation: {
    name: "Saturation",
    type: "2d",
    tree: () => [
      operations.saturation({ factor: 0.5 }, [
        operations.drawImage({ imageUrl: availableImages.homer }),
      ]),
    ],
  },
  convolve: {
    name: "Convolve",
    type: "2d",
    tree: () => [
      operations.convolve(
        {
          kernel: [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
          ],
        },
        [operations.drawImage({ imageUrl: availableImages.homer })],
      ),
    ],
  },
  transform: {
    name: "Transform",
    type: "2d",
    tree: () => [
      operations.transform({ translateX: 250, translateY: 500, scale: 0.5 }, [
        operations.drawImage({ imageUrl: availableImages.homer }),
      ]),
    ],
  },
  cyl: {
    name: "Cylinder",
    type: "lifestyle",
    tree: () => [
      operations.drawImage({
        imageUrl: "mug.png",
      }),
      operations.cyl(
        {
          controlPoints: [
            {
              x: 0.17,
              y: 0.2753333282470703,
            },
            {
              x: 0.332,
              y: 0.3953333282470703,
            },
            {
              x: 0.538,
              y: 0.2793333282470703,
            },
            {
              x: 0.186,
              y: 0.5513333282470703,
            },
            {
              x: 0.374,
              y: 0.6673333282470704,
            },
            {
              x: 0.51,
              y: 0.5433333282470703,
            },
          ],
          diameterTop: 1,
          diameterBottom: 1,
          height: 1.6,
          side: 1,
        },
        [operations.drawImage({ imageUrl: availableImages.mona })],
      ),
      operations.drawImage({
        imageUrl: "mug-overlay.png",
      }),
    ],
  },
} as const;
