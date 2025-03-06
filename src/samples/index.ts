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

export const samples = {
  wood: {
    name: "Engraved wood",
    tree: engravedWoodTree,
  },
  glass: {
    name: "Engraved glass",
    tree: engravedGlassTree,
  },
  gold: {
    name: "Gold foil",
    tree: goldFoilTree,
  },
  cap: {
    name: "Cap",
    tree: capTree,
  },
  pillow: {
    name: "Pillow",
    tree: pillowTree,
  },
  pillow2: {
    name: "Pillow 2",
    tree: pillow2Tree,
  },
  bevel: {
    name: "Bevel",
    tree: bevel1Tree,
  },

  convolution: {
    name: "Convolution Kernel",
    tree: convolutionSamplesTree,
  },
  // meshWarp: {
  //   name: "Mesh Warp",
  //   tree: meshWarpTree,
  // },
  bicubicGrid: {
    name: "Bicubic Grid",
    tree: bicubicGridTree,
  },
  bSplinePoints: {
    name: "B-Spline Points",
    tree: bSplinePointsTree,
  },
  displacement: {
    name: "Displacement Map",
    tree: displacementTree,
  },
  uv: {
    name: "UV Map",
    tree: uvTree,
  },
  perspective: {
    name: "Perspective",
    tree: perspectiveTree,
  },
} as const;
