/**
 * Map-related types for DOOM
 */

import type { Vec2, BoundingBox, Fixed } from '../types';

/**
 * A vertex (point) in the map
 */
export interface Vertex {
  x: Fixed;
  y: Fixed;
}

/**
 * A sector (room/area) in the map
 */
export interface Sector {
  floorHeight: Fixed;
  ceilingHeight: Fixed;
  floorTexture: string;
  ceilingTexture: string;
  lightLevel: number;
  specialType: number;
  tag: number;
}

/**
 * A sidedef (side of a wall)
 */
export interface Sidedef {
  xOffset: Fixed;
  yOffset: Fixed;
  upperTexture: string;
  lowerTexture: string;
  middleTexture: string;
  sector: number; // Sector index
}

/**
 * A linedef (wall line)
 */
export interface Linedef {
  startVertex: number; // Vertex index
  endVertex: number; // Vertex index
  flags: number;
  specialType: number;
  sectorTag: number;
  rightSidedef: number; // Sidedef index (-1 if none)
  leftSidedef: number; // Sidedef index (-1 if none)
}

/**
 * A segment (part of a linedef)
 */
export interface Seg {
  startVertex: number;
  endVertex: number;
  angle: number;
  linedef: number;
  direction: number; // 0 = same direction as linedef, 1 = opposite
  offset: Fixed;
}

/**
 * A subsector (leaf of BSP tree)
 */
export interface Subsector {
  segCount: number;
  firstSeg: number;
}

/**
 * A node in the BSP tree
 */
export interface Node {
  x: Fixed; // Partition line start
  y: Fixed;
  dx: Fixed; // Partition line direction
  dy: Fixed;
  rightBox: BoundingBox;
  leftBox: BoundingBox;
  rightChild: number; // If bit 15 is set, it's a subsector
  leftChild: number;
}

/**
 * A blockmap for collision detection
 */
export interface Blockmap {
  originX: Fixed;
  originY: Fixed;
  columns: number;
  rows: number;
  blockLists: number[][]; // For each block, list of linedef indices
}

/**
 * A reject table (line of sight optimization)
 */
export interface Reject {
  data: Uint8Array;
  sectorCount: number;
}

/**
 * Complete map data
 */
export interface MapData {
  name: string;
  vertices: Vertex[];
  sectors: Sector[];
  sidedefs: Sidedef[];
  linedefs: Linedef[];
  segs: Seg[];
  subsectors: Subsector[];
  nodes: Node[];
  blockmap: Blockmap;
  reject: Reject;
  boundingBox: BoundingBox;
}

/**
 * Helper to check if a child is a subsector
 */
export function isSubsector(child: number): boolean {
  return (child & 0x8000) !== 0;
}

/**
 * Get subsector index from child
 */
export function getSubsectorIndex(child: number): number {
  return child & 0x7fff;
}

/**
 * Calculate bounding box from vertices
 */
export function calculateBoundingBox(vertices: Vertex[]): BoundingBox {
  if (vertices.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = vertices[0].x;
  let minY = vertices[0].y;
  let maxX = vertices[0].x;
  let maxY = vertices[0].y;

  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Get the distance from a point to a line
 */
export function pointToLineDist(point: Vec2, lineStart: Vec2, lineEnd: Vec2): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLength = Math.sqrt(dx * dx + dy * dy);

  if (lineLength === 0) {
    const pdx = point.x - lineStart.x;
    const pdy = point.y - lineStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (lineLength * lineLength)
    )
  );

  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  const distX = point.x - projX;
  const distY = point.y - projY;

  return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Check which side of a line a point is on
 * Returns: positive = right, negative = left, 0 = on line
 */
export function pointSide(point: Vec2, lineStart: Vec2, lineEnd: Vec2): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  return (point.x - lineStart.x) * dy - (point.y - lineStart.y) * dx;
}
