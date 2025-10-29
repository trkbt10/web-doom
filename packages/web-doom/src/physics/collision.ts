/**
 * Collision detection system
 */

import type { Vec2 } from '../types';
import type { MapData } from '../map/types';
import type { Thing } from '../entities/types';
import { pointSide } from '../map/types';
import { LineFlags } from '../types';

/**
 * Collision result
 */
export interface CollisionResult {
  collided: boolean;
  position: Vec2;
  blocked: boolean;
  blockingLine?: number; // Linedef index
  sector?: number; // Current sector
}

/**
 * Check collision between a point and a line
 */
export function checkLineCollision(
  position: Vec2,
  radius: number,
  lineStart: Vec2,
  lineEnd: Vec2
): boolean {
  // Calculate line direction
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLength = Math.sqrt(dx * dx + dy * dy);

  if (lineLength === 0) return false;

  // Normalize
  const nx = dx / lineLength;
  const ny = dy / lineLength;

  // Calculate perpendicular
  const perpX = -ny;
  const perpY = nx;

  // Distance from point to line
  const toPointX = position.x - lineStart.x;
  const toPointY = position.y - lineStart.y;
  const distToLine = Math.abs(toPointX * perpX + toPointY * perpY);

  if (distToLine > radius) return false;

  // Check if projection is on the line segment
  const projection = toPointX * nx + toPointY * ny;
  return projection >= 0 && projection <= lineLength;
}

/**
 * Try to move from one position to another
 */
export function tryMove(
  map: MapData,
  from: Vec2,
  to: Vec2,
  radius: number,
  height: number
): CollisionResult {
  let finalPos = { ...to };
  let blocked = false;
  let blockingLine: number | undefined;

  // Get lines in the blockmap area
  const linesToCheck = getLinesInArea(map, from, to, radius);

  for (const lineIndex of linesToCheck) {
    const linedef = map.linedefs[lineIndex];

    // Skip non-blocking lines
    if (!(linedef.flags & LineFlags.BLOCKING)) {
      // Check if it's two-sided
      if (linedef.flags & LineFlags.TWOSIDED) {
        // Check height difference
        if (linedef.rightSidedef >= 0 && linedef.leftSidedef >= 0) {
          const rightSector = map.sidedefs[linedef.rightSidedef].sector;
          const leftSector = map.sidedefs[linedef.leftSidedef].sector;

          const rightFloor = map.sectors[rightSector].floorHeight;
          const rightCeiling = map.sectors[rightSector].ceilingHeight;
          const leftFloor = map.sectors[leftSector].floorHeight;
          const leftCeiling = map.sectors[leftSector].ceilingHeight;

          // Check if can pass through (height-wise)
          const lowestCeiling = Math.min(rightCeiling, leftCeiling);
          const highestFloor = Math.max(rightFloor, leftFloor);

          if (lowestCeiling - highestFloor < height) {
            // Can't fit through
            continue;
          }
        }
      } else {
        continue; // Not blocking
      }
    }

    // Get line vertices
    const v1 = map.vertices[linedef.startVertex];
    const v2 = map.vertices[linedef.endVertex];
    const lineStart = { x: v1.x, y: v1.y };
    const lineEnd = { x: v2.x, y: v2.y };

    // Check collision
    if (checkLineCollision(to, radius, lineStart, lineEnd)) {
      blocked = true;
      blockingLine = lineIndex;

      // Slide along the wall
      const slidePos = slideAlongWall(from, to, lineStart, lineEnd, radius);
      finalPos = slidePos;
      break;
    }
  }

  // Find current sector
  const sector = findSector(map, finalPos);

  return {
    collided: blocked,
    position: finalPos,
    blocked,
    blockingLine,
    sector,
  };
}

/**
 * Slide along a wall when colliding
 */
function slideAlongWall(
  from: Vec2,
  to: Vec2,
  wallStart: Vec2,
  wallEnd: Vec2,
  radius: number
): Vec2 {
  // Calculate wall direction
  const wallDx = wallEnd.x - wallStart.x;
  const wallDy = wallEnd.y - wallStart.y;
  const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

  if (wallLength === 0) return from;

  // Normalize wall direction
  const wallNx = wallDx / wallLength;
  const wallNy = wallDy / wallLength;

  // Calculate movement direction
  const moveDx = to.x - from.x;
  const moveDy = to.y - from.y;

  // Project movement onto wall
  const projection = moveDx * wallNx + moveDy * wallNy;
  const slideX = from.x + projection * wallNx;
  const slideY = from.y + projection * wallNy;

  // Push away from wall slightly
  const perpX = -wallNy;
  const perpY = wallNx;

  // Determine which side we're on
  const side = pointSide(from, wallStart, wallEnd);
  const pushDir = side > 0 ? 1 : -1;

  return {
    x: slideX + perpX * pushDir * (radius + 1),
    y: slideY + perpY * pushDir * (radius + 1),
  };
}

/**
 * Get lines in the area between two points (using blockmap)
 */
function getLinesInArea(map: MapData, from: Vec2, to: Vec2, radius: number): number[] {
  const blockmap = map.blockmap;

  // Calculate bounding box
  const minX = Math.min(from.x, to.x) - radius;
  const maxX = Math.max(from.x, to.x) + radius;
  const minY = Math.min(from.y, to.y) - radius;
  const maxY = Math.max(from.y, to.y) + radius;

  // Convert to blockmap coordinates
  const blockSize = 128; // DOOM blockmap size
  const minBlockX = Math.floor((minX - blockmap.originX) / blockSize);
  const maxBlockX = Math.floor((maxX - blockmap.originX) / blockSize);
  const minBlockY = Math.floor((minY - blockmap.originY) / blockSize);
  const maxBlockY = Math.floor((maxY - blockmap.originY) / blockSize);

  // Collect all lines in these blocks
  const lines = new Set<number>();

  for (let by = minBlockY; by <= maxBlockY; by++) {
    for (let bx = minBlockX; bx <= maxBlockX; bx++) {
      if (bx >= 0 && bx < blockmap.columns && by >= 0 && by < blockmap.rows) {
        const blockIndex = by * blockmap.columns + bx;
        if (blockIndex < blockmap.blockLists.length) {
          for (const lineIndex of blockmap.blockLists[blockIndex]) {
            lines.add(lineIndex);
          }
        }
      }
    }
  }

  return Array.from(lines);
}

/**
 * Find which sector a point is in
 */
export function findSector(map: MapData, point: Vec2): number | undefined {
  // Start at root node and traverse BSP tree
  if (map.nodes.length === 0) return undefined;

  let nodeIndex = map.nodes.length - 1; // Start at root

  while (true) {
    const node = map.nodes[nodeIndex];

    // Check which side of the partition line the point is on
    const dx = point.x - node.x;
    const dy = point.y - node.y;
    const side = dx * node.dy - dy * node.dx;

    // Choose child based on side
    const child = side < 0 ? node.leftChild : node.rightChild;

    // Check if child is a subsector
    if (child & 0x8000) {
      // It's a subsector
      const subsectorIndex = child & 0x7fff;
      if (subsectorIndex >= map.subsectors.length) return undefined;

      const subsector = map.subsectors[subsectorIndex];
      if (subsector.segCount === 0) return undefined;

      // Get sector from first seg
      const seg = map.segs[subsector.firstSeg];
      const linedef = map.linedefs[seg.linedef];

      // Get sector from appropriate sidedef
      const sidedefIndex = seg.direction === 0 ? linedef.rightSidedef : linedef.leftSidedef;
      if (sidedefIndex < 0) return undefined;

      return map.sidedefs[sidedefIndex].sector;
    } else {
      // It's another node
      nodeIndex = child;
      if (nodeIndex >= map.nodes.length) return undefined;
    }
  }
}

/**
 * Check collision between two things
 */
export function checkThingCollision(thing1: Thing, thing2: Thing): boolean {
  const dx = thing1.position.x - thing2.position.x;
  const dy = thing1.position.y - thing2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = thing1.radius + thing2.radius;

  return distance < minDistance;
}

/**
 * Get height at position (floor and ceiling)
 */
export function getHeightAt(
  map: MapData,
  position: Vec2
): { floor: number; ceiling: number } | null {
  const sectorIndex = findSector(map, position);
  if (sectorIndex === undefined) return null;

  const sector = map.sectors[sectorIndex];
  return {
    floor: sector.floorHeight,
    ceiling: sector.ceilingHeight,
  };
}
