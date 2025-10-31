/**
 * Texture Group Manager
 * Manages texture groups, sprite sheet generation, and transformations
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { packTextures } from '../utils/sprite-packer';
import {
  validatePackedTextures,
  validateLayoutConsistency,
  generateReport,
} from '../utils/sprite-layout-validator';
import sharp from 'sharp';

const DATA_ROOT = join(process.cwd(), 'data');

export interface TextureLayout {
  textureName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextureGroup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  textureNames: string[];
  spriteSheetBase64?: string;
  transformedSpriteSheetBase64?: string;
  layout: TextureLayout[];
  spriteSheetWidth?: number;
  spriteSheetHeight?: number;
  createdAt: string;
  updatedAt: string;
  transformHistory: GroupTransformRecord[];
}

export interface GroupTransformRecord {
  timestamp: string;
  prompt: string;
  transformer: 'gemini'; // Always Gemini for stability
  strength: number;
  steps: number;
  guidanceScale: number;
  negativePrompt?: string;
  resultBase64: string;
}

/**
 * Get groups directory for a project
 */
function getGroupsDir(projectId: string): string {
  return join(DATA_ROOT, projectId, 'groups');
}

/**
 * Get group file path
 */
function getGroupPath(projectId: string, groupId: string): string {
  return join(getGroupsDir(projectId), `${groupId}.json`);
}

/**
 * Ensure groups directory exists
 */
async function ensureGroupsDir(projectId: string): Promise<void> {
  const groupsDir = getGroupsDir(projectId);
  if (!existsSync(groupsDir)) {
    await mkdir(groupsDir, { recursive: true });
  }
}

/**
 * List all groups for a project
 */
export async function listGroups(projectId: string): Promise<TextureGroup[]> {
  const groupsDir = getGroupsDir(projectId);

  if (!existsSync(groupsDir)) {
    return [];
  }

  const files = await readdir(groupsDir);
  const groupFiles = files.filter(f => f.endsWith('.json'));

  const groups: TextureGroup[] = [];
  for (const file of groupFiles) {
    const content = await readFile(join(groupsDir, file), 'utf-8');
    groups.push(JSON.parse(content));
  }

  return groups.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get a specific group
 */
export async function getGroup(
  projectId: string,
  groupId: string
): Promise<TextureGroup | null> {
  const groupPath = getGroupPath(projectId, groupId);

  if (!existsSync(groupPath)) {
    return null;
  }

  const content = await readFile(groupPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Create a new texture group
 */
export async function createGroup(
  projectId: string,
  name: string,
  textureNames: string[],
  description?: string
): Promise<TextureGroup> {
  await ensureGroupsDir(projectId);

  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
  const now = new Date().toISOString();

  const group: TextureGroup = {
    id,
    projectId,
    name,
    description,
    textureNames,
    layout: [],
    createdAt: now,
    updatedAt: now,
    transformHistory: [],
  };

  const groupPath = getGroupPath(projectId, id);
  await writeFile(groupPath, JSON.stringify(group, null, 2));

  return group;
}

/**
 * Update a texture group
 */
export async function updateGroup(
  projectId: string,
  groupId: string,
  updates: Partial<Pick<TextureGroup, 'name' | 'description' | 'textureNames'>>
): Promise<TextureGroup> {
  const group = await getGroup(projectId, groupId);

  if (!group) {
    throw new Error(`Group ${groupId} not found`);
  }

  const updated: TextureGroup = {
    ...group,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const groupPath = getGroupPath(projectId, groupId);
  await writeFile(groupPath, JSON.stringify(updated, null, 2));

  return updated;
}

/**
 * Delete a texture group
 */
export async function deleteGroup(
  projectId: string,
  groupId: string
): Promise<void> {
  const groupPath = getGroupPath(projectId, groupId);

  if (existsSync(groupPath)) {
    const fs = await import('fs/promises');
    await fs.unlink(groupPath);
  }
}

/**
 * Generate sprite sheet from group textures
 */
export async function generateSpriteSheet(
  projectId: string,
  groupId: string
): Promise<TextureGroup> {
  const group = await getGroup(projectId, groupId);

  if (!group) {
    throw new Error(`Group ${groupId} not found`);
  }

  const projectDir = join(DATA_ROOT, projectId);
  const originalsDir = join(projectDir, 'originals');

  // Load all textures
  const textureData: Array<{
    name: string;
    width: number;
    height: number;
    imageData: Buffer;
  }> = [];

  for (const textureName of group.textureNames) {
    const texturePath = join(originalsDir, `${textureName}.png`);

    if (!existsSync(texturePath)) {
      console.warn(`Texture ${textureName} not found, skipping`);
      continue;
    }

    const imageBuffer = await readFile(texturePath);
    const metadata = await sharp(imageBuffer).metadata();

    textureData.push({
      name: textureName,
      width: metadata.width || 0,
      height: metadata.height || 0,
      imageData: imageBuffer,
    });
  }

  // Pack textures into sprite sheet with optimized settings
  const packResult = packTextures(textureData, {
    targetSize: 1024,  // Try to fit in 1024x1024 first
    maxSize: 2048,     // Max size 2048x2048
    allowRectangular: true, // Allow non-square canvas for better packing
  });

  // Validate packed texture coordinates
  console.log('\n🔍 Validating packed texture coordinates...');
  const packValidation = validatePackedTextures(
    packResult.textures,
    packResult.width,
    packResult.height
  );
  console.log(generateReport(packValidation));

  if (!packValidation.valid) {
    throw new Error('Sprite packing validation failed. Check console for details.');
  }

  // Create sprite sheet canvas
  const canvas = sharp({
    create: {
      width: packResult.width,
      height: packResult.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  // Composite all textures onto the canvas at their content positions
  const composites = await Promise.all(
    packResult.textures.map(async (texture) => {
      const resized = await sharp(texture.imageData)
        .resize(texture.contentWidth, texture.contentHeight, { fit: 'fill' })
        .toBuffer();

      // Debug log to verify coordinates
      console.log(`[Sprite Placement] ${texture.name}: ` +
        `Cell(${texture.x}, ${texture.y}, ${texture.width}x${texture.height}) ` +
        `Content(${texture.contentX}, ${texture.contentY}, ${texture.contentWidth}x${texture.contentHeight})`);

      return {
        input: resized,
        left: texture.contentX,
        top: texture.contentY,
      };
    })
  );

  // Generate sprite sheet with guidelines
  let spriteSheetBuffer = await canvas.composite(composites).png().toBuffer();

  // Add grid guidelines to help AI recognize sprite boundaries
  spriteSheetBuffer = await addGridGuidelines(
    spriteSheetBuffer,
    packResult.width,
    packResult.height,
    packResult.textures
  );

  const spriteSheetBase64 = `data:image/png;base64,${spriteSheetBuffer.toString('base64')}`;

  // Update group with sprite sheet and layout
  // Store content area for extraction (actual image location)
  const layout: TextureLayout[] = packResult.textures.map(t => {
    const layoutData = {
      textureName: t.name,
      x: t.contentX,
      y: t.contentY,
      width: t.contentWidth,
      height: t.contentHeight,
    };
    console.log(`[Layout Saved] ${t.name}: Extract from (${layoutData.x}, ${layoutData.y}, ${layoutData.width}x${layoutData.height})`);
    return layoutData;
  });

  // Validate layout consistency
  console.log('\n🔍 Validating layout consistency...');
  const layoutValidation = validateLayoutConsistency(packResult.textures, layout);
  console.log(generateReport(layoutValidation));

  if (!layoutValidation.valid) {
    throw new Error('Layout consistency validation failed. Check console for details.');
  }

  console.log('\n✅ All validations passed! Sprite coordinates are consistent.\n');

  const updated: TextureGroup = {
    ...group,
    spriteSheetBase64,
    layout,
    spriteSheetWidth: packResult.width,
    spriteSheetHeight: packResult.height,
    updatedAt: new Date().toISOString(),
  };

  const groupPath = getGroupPath(projectId, groupId);
  await writeFile(groupPath, JSON.stringify(updated, null, 2));

  return updated;
}

export interface ExtractedTextureResult {
  textureName: string;
  originalBase64: string;
  transformedBase64: string;
  width: number;
  height: number;
}

/**
 * Extract individual textures from transformed sprite sheet
 * Uses the content coordinates (actual sprite area) for extraction
 * Returns the extracted texture data for preview
 */
export async function extractTexturesFromSpriteSheet(
  projectId: string,
  groupId: string
): Promise<ExtractedTextureResult[]> {
  const group = await getGroup(projectId, groupId);

  if (!group) {
    throw new Error(`Group ${groupId} not found`);
  }

  if (!group.transformedSpriteSheetBase64) {
    throw new Error('No transformed sprite sheet available');
  }

  const projectDir = join(DATA_ROOT, projectId);
  const texturesDir = join(projectDir, 'textures');

  // Parse base64 sprite sheet
  const base64Data = group.transformedSpriteSheetBase64.replace(/^data:image\/\w+;base64,/, '');
  const spriteSheetBuffer = Buffer.from(base64Data, 'base64');

  // Get actual transformed sprite sheet dimensions
  const transformedMetadata = await sharp(spriteSheetBuffer).metadata();
  const transformedWidth = transformedMetadata.width || group.spriteSheetWidth || 1024;
  const transformedHeight = transformedMetadata.height || group.spriteSheetHeight || 1024;

  // Calculate scale factor (in case AI resized the image)
  const originalWidth = group.spriteSheetWidth || 1024;
  const originalHeight = group.spriteSheetHeight || 1024;
  const scaleX = transformedWidth / originalWidth;
  const scaleY = transformedHeight / originalHeight;

  console.log(`\n📏 Sprite Sheet Dimensions:`);
  console.log(`  Original: ${originalWidth}x${originalHeight}`);
  console.log(`  Transformed: ${transformedWidth}x${transformedHeight}`);
  console.log(`  Scale: ${scaleX.toFixed(3)}x, ${scaleY.toFixed(3)}y\n`);

  const results: ExtractedTextureResult[] = [];

  // Extract each texture according to layout
  // IMPORTANT: Use x, y, width, height from layout which are the CONTENT coordinates
  // Apply scale factor to handle AI-resized images
  for (const layout of group.layout) {
    try {
      // The layout.x, layout.y, layout.width, layout.height ARE the content coordinates
      // These are set in generateSpriteSheet from contentX, contentY, contentWidth, contentHeight
      // Apply scale factor if the transformed image was resized by AI
      const extractRect = {
        left: Math.round(layout.x * scaleX),
        top: Math.round(layout.y * scaleY),
        width: Math.round(layout.width * scaleX),
        height: Math.round(layout.height * scaleY),
      };

      console.log(`[Extracting] ${layout.textureName}:`);
      console.log(`  Layout coords: (${layout.x}, ${layout.y}, ${layout.width}x${layout.height})`);
      console.log(`  Scaled coords: (${extractRect.left}, ${extractRect.top}, ${extractRect.width}x${extractRect.height})`);

      let extracted = await sharp(spriteSheetBuffer)
        .extract(extractRect)
        .png()
        .toBuffer();

      // If the image was scaled, resize back to original dimensions
      if (scaleX !== 1 || scaleY !== 1) {
        console.log(`  Resizing back to original: ${layout.width}x${layout.height}`);
        extracted = await sharp(extracted)
          .resize(layout.width, layout.height, {
            fit: 'fill',
            kernel: 'lanczos3', // High-quality resampling
          })
          .png()
          .toBuffer();
      }

      const extractedBase64 = `data:image/png;base64,${extracted.toString('base64')}`;

      // Update texture metadata
      const textureMetadataPath = join(texturesDir, `${layout.textureName}.json`);

      let originalBase64 = '';
      if (existsSync(textureMetadataPath)) {
        const content = await readFile(textureMetadataPath, 'utf-8');
        const metadata = JSON.parse(content);

        originalBase64 = metadata.originalBase64 || '';
        metadata.transformedBase64 = extractedBase64;
        metadata.updatedAt = new Date().toISOString();

        await writeFile(textureMetadataPath, JSON.stringify(metadata, null, 2));
      } else {
        console.warn(`Metadata file not found for texture: ${layout.textureName}`);
      }

      // Add to results for preview
      results.push({
        textureName: layout.textureName,
        originalBase64,
        transformedBase64: extractedBase64,
        width: extractRect.width,
        height: extractRect.height,
      });
    } catch (error) {
      console.error(`Failed to extract texture ${layout.textureName}:`, error);
      // Continue with other textures
    }
  }

  return results;
}

/**
 * Add transform record to group
 */
export async function addGroupTransformRecord(
  projectId: string,
  groupId: string,
  record: GroupTransformRecord
): Promise<TextureGroup> {
  const group = await getGroup(projectId, groupId);

  if (!group) {
    throw new Error(`Group ${groupId} not found`);
  }

  const updated: TextureGroup = {
    ...group,
    transformedSpriteSheetBase64: record.resultBase64,
    transformHistory: [...group.transformHistory, record],
    updatedAt: new Date().toISOString(),
  };

  const groupPath = getGroupPath(projectId, groupId);
  await writeFile(groupPath, JSON.stringify(updated, null, 2));

  return updated;
}

/**
 * Add grid guidelines to sprite sheet to help AI recognize sprite boundaries
 * Guidelines are placed OUTSIDE the sprite content area to avoid overlap
 */
async function addGridGuidelines(
  imageBuffer: Buffer,
  width: number,
  height: number,
  textures: Array<{
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    contentX: number;
    contentY: number;
    contentWidth: number;
    contentHeight: number;
    layout: any; // SpriteLayout from sprite-coordinates
  }>
): Promise<Buffer> {
  // Build SVG with grid lines and labels
  const elements: string[] = [];

  // Add boundary rectangles and labels for each sprite
  for (const texture of textures) {
    const { guidelines, label } = texture.layout;

    // Draw outer cell boundary (entire allocated space)
    // Dashed lime green line to show cell boundaries
    elements.push(
      '<rect x="' + guidelines.outer.x + '" y="' + guidelines.outer.y + '" ' +
      'width="' + guidelines.outer.width + '" height="' + guidelines.outer.height + '" ' +
      'fill="none" stroke="lime" stroke-width="2" opacity="0.6" stroke-dasharray="6,3"/>'
    );

    // Draw inner content boundary (actual image area)
    // Solid cyan line AROUND the sprite, not overlapping it
    elements.push(
      '<rect x="' + guidelines.inner.x + '" y="' + guidelines.inner.y + '" ' +
      'width="' + guidelines.inner.width + '" height="' + guidelines.inner.height + '" ' +
      'fill="none" stroke="cyan" stroke-width="2" opacity="0.8"/>'
    );

    // Add corner markers OUTSIDE content area (on guideline positions)
    const markerSize = 3;
    const corners = [
      { x: guidelines.inner.x, y: guidelines.inner.y }, // Top-left
      { x: guidelines.inner.x + guidelines.inner.width, y: guidelines.inner.y }, // Top-right
      { x: guidelines.inner.x, y: guidelines.inner.y + guidelines.inner.height }, // Bottom-left
      { x: guidelines.inner.x + guidelines.inner.width, y: guidelines.inner.y + guidelines.inner.height }, // Bottom-right
    ];

    for (const corner of corners) {
      elements.push(
        '<circle cx="' + corner.x + '" cy="' + corner.y + '" r="' + markerSize + '" ' +
        'fill="cyan" opacity="1.0"/>'
      );
    }

    // Add sprite name label below the sprite
    // Calculate label width based on name length
    const labelWidth = Math.max(texture.name.length * 7, 40);
    const labelHeight = 14;

    // Background for text readability
    elements.push(
      '<rect x="' + (label.x - labelWidth / 2) + '" y="' + (label.y - labelHeight + 2) + '" ' +
      'width="' + labelWidth + '" height="' + labelHeight + '" fill="black" opacity="0.7" rx="2"/>'
    );

    // Text label
    elements.push(
      '<text x="' + label.x + '" y="' + label.y + '" ' +
      'font-family="Arial, sans-serif" font-size="10" font-weight="bold" ' +
      'fill="white" text-anchor="middle">' +
      texture.name +
      '</text>'
    );
  }

  const svg =
    '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">\n' +
    '      ' + elements.join('\n      ') + '\n' +
    '    </svg>';

  const svgBuffer = Buffer.from(svg);

  // Composite the grid overlay onto the sprite sheet
  return sharp(imageBuffer)
    .composite([{
      input: svgBuffer,
      top: 0,
      left: 0,
    }])
    .png()
    .toBuffer();
}
