import { engravedWoodTree } from "./engraved-wood";
import { engravedGlassTree } from "./engraved-glass";
import { goldFoilTree } from "./gold-foil";
import { capTree } from "./cap";

import { bevel1Tree } from "./bevel";
import { convolutionSamplesTree } from "./convolution-kernel";
import { displacementTree } from "./displacement";
import { bSplinePointsTree } from "./spline-points";
import { uvTree } from "./uv";
import { perspectiveTree } from "./perspective";
import { bicubicGridTree } from "./bicubic-grid";
import { pillowTree } from "./pillow";
import { pillow2Tree } from "./pillow2";
import { opacityTree } from "./opacity";
import { shadowTree } from "./shadow";
import { catmullRomTree } from "./catmull-rom";

export const samples = {
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
