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
      operations.drawImage({ imageUrl: availableImages.testbeeld }),
      operations.blend("multiply", [
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
} as const;
