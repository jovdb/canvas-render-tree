// Beier-Neely Morphing Algorithm
// Based on: "Feature-Based Image Metamorphosis" by T. Beier and S. Neely
// https://dl.acm.org/doi/10.1145/37402.37422

import { IRenderItem, ItemDrawFn, RenderTree } from "../canvas";
import { addRendererOverlay, ItemOverlayFn } from "../overlays";
import { addRenderer } from "../renderers";
import React from "react";
import {
  FreeControlPointsOverlay,
  FreeControlPoint,
  FreeControlPointsConfig,
} from "../components/FreeControlPointsOverlay";

// ============================================================================
// Types
// ============================================================================

export interface IBeierNeelyConfig extends FreeControlPointsConfig {
  /** Strength of the deformation (0-1) */
  strength?: number;
  /** Falloff exponent for distance weighting (higher = more localized deformation) */
  falloff?: number;
  /** Minimum distance for influence (prevents division by zero) */
  minDistance?: number;
}

// ============================================================================
// Beier-Neely Implementation
// ============================================================================

/**
 * Beier-Neely warper class
 * Implements feature-based image metamorphosis using control point pairs
 */
class BeierNeelyWarper {
  private width: number;
  private height: number;
  private sourcePoints: { x: number; y: number }[];
  private targetPoints: { x: number; y: number }[];
  private strength: number;
  private falloff: number;
  private minDistance: number;

  constructor(
    width: number,
    height: number,
    sourcePoints: { x: number; y: number }[],
    targetPoints: { x: number; y: number }[],
    strength: number = 1.0,
    falloff: number = 2.0,
    minDistance: number = 0.01,
  ) {
    this.width = width;
    this.height = height;
    this.sourcePoints = sourcePoints;
    this.targetPoints = targetPoints;
    this.strength = strength;
    this.falloff = falloff;
    this.minDistance = minDistance;
  }

  /**
   * Calculate the weight for a given distance
   * Uses: w(d) = 1 / (d^p + c) where p is falloff and c is a small constant
   */
  private calculateWeight(d: number): number {
    // Avoid division by zero
    const clampedD = Math.max(d, this.minDistance);
    return 1.0 / Math.pow(clampedD, this.falloff);
  }

  /**
   * Calculate the normalized weight for a point relative to all control points
   */
  private calculateNormalizedWeights(x: number, y: number): number[] {
    const weights: number[] = [];
    let sumWeights = 0;

    // Calculate raw weights
    for (let i = 0; i < this.sourcePoints.length; i++) {
      const dx = x - this.sourcePoints[i].x;
      const dy = y - this.sourcePoints[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      weights[i] = this.calculateWeight(dist);
      sumWeights += weights[i];
    }

    // Normalize weights
    if (sumWeights > 0) {
      for (let i = 0; i < weights.length; i++) {
        weights[i] /= sumWeights;
      }
    } else {
      // If all weights are zero, distribute evenly
      const n = weights.length;
      if (n > 0) {
        const uniformWeight = 1.0 / n;
        for (let i = 0; i < weights.length; i++) {
          weights[i] = uniformWeight;
        }
      }
    }

    return weights;
  }

  /**
   * Apply Beier-Neely transformation to a single point
   * The transformation is a weighted average of the displacements
   */
  private transformPoint(x: number, y: number): { tx: number; ty: number } {
    const n = this.sourcePoints.length;

    if (n === 0) {
      return { tx: x, ty: y };
    }

    const weights = this.calculateNormalizedWeights(x, y);

    let sumWx = 0;
    let sumWy = 0;
    let sumWeightedDx = 0;
    let sumWeightedDy = 0;

    for (let i = 0; i < n; i++) {
      const w = weights[i];
      sumWx += w * this.sourcePoints[i].x;
      sumWy += w * this.sourcePoints[i].y;
      sumWeightedDx += w * (this.targetPoints[i].x - this.sourcePoints[i].x);
      sumWeightedDy += w * (this.targetPoints[i].y - this.sourcePoints[i].y);
    }

    // Calculate the transformed point
    // T(x,y) = (x, y) + Σ w_i * (P'_i - P_i)
    // where w_i is the normalized weight
    const tx = x + sumWeightedDx;
    const ty = y + sumWeightedDy;

    return { tx, ty };
  }

  /**
   * Warp the image using Beier-Neely transformation
   */
  public warpImage(sourceData: ImageData): ImageData {
    const targetData = new ImageData(this.width, this.height);
    const srcPixels = new Uint32Array(sourceData.data.buffer);
    const dstPixels = new Uint32Array(targetData.data.buffer);

    for (let y = 0; y < this.height; y++) {
      const normY = y / (this.height - 1);

      for (let x = 0; x < this.width; x++) {
        const normX = x / (this.width - 1);

        // Transform the normalized point
        const { tx, ty } = this.transformPoint(normX, normY);

        // Apply strength
        const srcX = x - (tx - normX) * this.width * this.strength;
        const srcY = y - (ty - normY) * this.height * this.strength;

        // Bilinear interpolation
        if (
          srcX >= 0 &&
          srcX < this.width - 1 &&
          srcY >= 0 &&
          srcY < this.height - 1
        ) {
          const xFloor = Math.floor(srcX);
          const yFloor = Math.floor(srcY);
          const xWeight = srcX - xFloor;
          const yWeight = srcY - yFloor;

          const idx00 = yFloor * this.width + xFloor;
          const idx10 = idx00 + 1;
          const idx01 = idx00 + this.width;
          const idx11 = idx01 + 1;

          const p00 = srcPixels[idx00];
          const p10 = srcPixels[idx10];
          const p01 = srcPixels[idx01];
          const p11 = srcPixels[idx11];

          let r = 0,
            g = 0,
            b = 0,
            a = 0;
          for (let shift = 0; shift <= 24; shift += 8) {
            const c00 = (p00 >> shift) & 0xff;
            const c10 = (p10 >> shift) & 0xff;
            const c01 = (p01 >> shift) & 0xff;
            const c11 = (p11 >> shift) & 0xff;

            const top = c00 + xWeight * (c10 - c00);
            const bottom = c01 + xWeight * (c11 - c01);
            const val = Math.round(top + yWeight * (bottom - top));

            if (shift === 0) r = val;
            else if (shift === 8) g = val;
            else if (shift === 16) b = val;
            else a = val;
          }

          dstPixels[y * this.width + x] = r | (g << 8) | (b << 16) | (a << 24);
        } else {
          // Out of bounds - transparent
          dstPixels[y * this.width + x] = 0x00000000;
        }
      }
    }

    return targetData;
  }
}

// ============================================================================
// Factory function
// ============================================================================

export const beierNeely = (
  {
    controlPoints = [],
    strength = 1.0,
    falloff = 2.0,
    minDistance = 0.01,
  }: IBeierNeelyConfig,
  input: RenderTree,
): IRenderItem<IBeierNeelyConfig> => ({
  name: "beierNeely",
  config: { controlPoints, strength, falloff, minDistance },
  input,
});

// ============================================================================
// Draw Function
// ============================================================================

export const draw: ItemDrawFn<IBeierNeelyConfig> = (
  ctx,
  drawPrev,
  config,
  drawInput,
) => {
  drawPrev?.(ctx);

  if (!drawInput) return;

  ctx.save();
  drawInput(ctx);

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const originalData = ctx.getImageData(0, 0, w, h);

  const {
    controlPoints = [],
    strength = 1.0,
    falloff = 2.0,
    minDistance = 0.01,
  } = config || {};

  // Convert control points to source and target points
  const srcPts = controlPoints.map((p) => ({ x: p.x, y: p.y }));
  const tgtPts = controlPoints.map((p) => ({ x: p.x + p.dx, y: p.y + p.dy }));

  const warper = new BeierNeelyWarper(
    w,
    h,
    srcPts,
    tgtPts,
    strength,
    falloff,
    minDistance,
  );

  const warpedData = warper.warpImage(originalData);
  ctx.putImageData(warpedData, 0, 0);

  ctx.restore();
};

addRenderer("beierNeely", {
  draw,
});

// ============================================================================
// Overlay Component
// ============================================================================

export const BeierNeelyOverlay: ItemOverlayFn<IBeierNeelyConfig> = (props) => {
  // Use the reusable FreeControlPointsOverlay component
  return <FreeControlPointsOverlay<IBeierNeelyConfig> {...props} />;
};

addRendererOverlay("beierNeely", BeierNeelyOverlay);

// ============================================================================
// Config Component
// ============================================================================

import { addRendererConfig, ItemConfigFn } from "../configs";

export const BeierNeelyConfig: ItemConfigFn<IBeierNeelyConfig> = ({
  config,
  mutateConfig,
}) => {
  const { strength = 1.0, falloff = 2.0, minDistance = 0.01 } = config || {};

  return (
    <div
      style={{
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Strength: {strength.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={strength}
          onChange={(e) => {
            mutateConfig((newConfig: IBeierNeelyConfig) => {
              newConfig.strength = parseFloat(e.target.value);
            });
          }}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Falloff: {falloff.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.5"
          max="4"
          step="0.1"
          value={falloff}
          onChange={(e) => {
            mutateConfig((newConfig: IBeierNeelyConfig) => {
              newConfig.falloff = parseFloat(e.target.value);
            });
          }}
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: "11px", color: "#666" }}>
          Higher values = more localized deformation
        </div>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Min Distance: {minDistance.toFixed(4)}
        </label>
        <input
          type="range"
          min="0"
          max="0.1"
          step="0.001"
          value={minDistance}
          onChange={(e) => {
            mutateConfig((newConfig: IBeierNeelyConfig) => {
              newConfig.minDistance = parseFloat(e.target.value);
            });
          }}
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: "11px", color: "#666" }}>
          Prevents division by zero for nearby points
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#666" }}>
        <p>
          Beier-Neely morphing: Smooth deformations with localized influence.
        </p>
        <p>Click and drag blue points to move source positions.</p>
        <p>Click and drag green points to move target positions.</p>
      </div>
    </div>
  );
};

addRendererConfig("beierNeely", BeierNeelyConfig);
