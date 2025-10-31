/**
 * Sprite Layout Validator
 *
 * Validates that sprite coordinates are consistent throughout the workflow:
 * 1. Packing: calculates content coordinates
 * 2. Placement: uses content coordinates to place images
 * 3. Storage: saves content coordinates as layout
 * 4. Extraction: uses saved layout coordinates to extract
 */

import type { PackedTexture } from './sprite-packer';
import type { TextureLayout } from '../services/texture-group-manager';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: CoordinateDetail[];
}

export interface CoordinateDetail {
  textureName: string;
  cell: { x: number; y: number; width: number; height: number };
  content: { x: number; y: number; width: number; height: number };
  guideline: {
    outer: { x: number; y: number; width: number; height: number };
    inner: { x: number; y: number; width: number; height: number };
  };
  expectedExtraction: { left: number; top: number; width: number; height: number };
}

/**
 * Validate that packed textures have consistent coordinates
 */
export function validatePackedTextures(
  textures: PackedTexture[],
  canvasWidth: number,
  canvasHeight: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: CoordinateDetail[] = [];

  for (const texture of textures) {
    // Build coordinate detail
    const detail: CoordinateDetail = {
      textureName: texture.name,
      cell: {
        x: texture.x,
        y: texture.y,
        width: texture.width,
        height: texture.height,
      },
      content: {
        x: texture.contentX,
        y: texture.contentY,
        width: texture.contentWidth,
        height: texture.contentHeight,
      },
      guideline: texture.layout.guidelines,
      expectedExtraction: {
        left: texture.contentX,
        top: texture.contentY,
        width: texture.contentWidth,
        height: texture.contentHeight,
      },
    };
    details.push(detail);

    // Validate content is inside cell
    if (texture.contentX < texture.x) {
      errors.push(`${texture.name}: contentX (${texture.contentX}) is less than cell x (${texture.x})`);
    }
    if (texture.contentY < texture.y) {
      errors.push(`${texture.name}: contentY (${texture.contentY}) is less than cell y (${texture.y})`);
    }
    if (texture.contentX + texture.contentWidth > texture.x + texture.width) {
      errors.push(`${texture.name}: content extends beyond cell width`);
    }
    if (texture.contentY + texture.contentHeight > texture.y + texture.height) {
      errors.push(`${texture.name}: content extends beyond cell height`);
    }

    // Validate content is within canvas
    if (texture.contentX < 0 || texture.contentY < 0) {
      errors.push(`${texture.name}: content position is negative`);
    }
    if (texture.contentX + texture.contentWidth > canvasWidth) {
      errors.push(`${texture.name}: content extends beyond canvas width`);
    }
    if (texture.contentY + texture.contentHeight > canvasHeight) {
      errors.push(`${texture.name}: content extends beyond canvas height`);
    }

    // Validate guidelines don't overlap content
    const { guidelines } = texture.layout;
    if (guidelines.inner.x >= texture.contentX) {
      warnings.push(`${texture.name}: inner guideline may overlap content left edge`);
    }
    if (guidelines.inner.y >= texture.contentY) {
      warnings.push(`${texture.name}: inner guideline may overlap content top edge`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

/**
 * Validate that saved layout matches packed texture coordinates
 */
export function validateLayoutConsistency(
  packedTextures: PackedTexture[],
  savedLayout: TextureLayout[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: CoordinateDetail[] = [];

  // Create map for quick lookup
  const layoutMap = new Map<string, TextureLayout>();
  for (const layout of savedLayout) {
    layoutMap.set(layout.textureName, layout);
  }

  for (const packed of packedTextures) {
    const saved = layoutMap.get(packed.name);

    if (!saved) {
      errors.push(`${packed.name}: not found in saved layout`);
      continue;
    }

    // Validate coordinates match
    if (saved.x !== packed.contentX) {
      errors.push(
        `${packed.name}: saved x (${saved.x}) doesn't match content x (${packed.contentX})`
      );
    }
    if (saved.y !== packed.contentY) {
      errors.push(
        `${packed.name}: saved y (${saved.y}) doesn't match content y (${packed.contentY})`
      );
    }
    if (saved.width !== packed.contentWidth) {
      errors.push(
        `${packed.name}: saved width (${saved.width}) doesn't match content width (${packed.contentWidth})`
      );
    }
    if (saved.height !== packed.contentHeight) {
      errors.push(
        `${packed.name}: saved height (${saved.height}) doesn't match content height (${packed.contentHeight})`
      );
    }

    const detail: CoordinateDetail = {
      textureName: packed.name,
      cell: {
        x: packed.x,
        y: packed.y,
        width: packed.width,
        height: packed.height,
      },
      content: {
        x: packed.contentX,
        y: packed.contentY,
        width: packed.contentWidth,
        height: packed.contentHeight,
      },
      guideline: packed.layout.guidelines,
      expectedExtraction: {
        left: saved.x,
        top: saved.y,
        width: saved.width,
        height: saved.height,
      },
    };
    details.push(detail);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    details,
  };
}

/**
 * Generate a human-readable report
 */
export function generateReport(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('=== Sprite Layout Validation Report ===\n');
  lines.push(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}\n`);

  if (result.errors.length > 0) {
    lines.push('\n🚨 ERRORS:');
    for (const error of result.errors) {
      lines.push(`  - ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\n⚠️  WARNINGS:');
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  if (result.details.length > 0) {
    lines.push('\n📊 COORDINATE DETAILS:');
    for (const detail of result.details) {
      lines.push(`\n  ${detail.textureName}:`);
      lines.push(`    Cell:       (${detail.cell.x}, ${detail.cell.y}) ${detail.cell.width}x${detail.cell.height}`);
      lines.push(`    Content:    (${detail.content.x}, ${detail.content.y}) ${detail.content.width}x${detail.content.height}`);
      lines.push(`    Extraction: (${detail.expectedExtraction.left}, ${detail.expectedExtraction.top}) ${detail.expectedExtraction.width}x${detail.expectedExtraction.height}`);
      lines.push(`    Guidelines:`);
      lines.push(`      Outer: (${detail.guideline.outer.x}, ${detail.guideline.outer.y}) ${detail.guideline.outer.width}x${detail.guideline.outer.height}`);
      lines.push(`      Inner: (${detail.guideline.inner.x}, ${detail.guideline.inner.y}) ${detail.guideline.inner.width}x${detail.guideline.inner.height}`);
    }
  }

  return lines.join('\n');
}
