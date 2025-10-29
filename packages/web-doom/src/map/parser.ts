/**
 * Map data parser - reads map data from WAD lumps
 */

import { findLump } from '@web-doom/wad';
import type { WadFile, WadLump } from '@web-doom/wad';
import type {
  MapData,
  Vertex,
  Sector,
  Sidedef,
  Linedef,
  Seg,
  Subsector,
  Node,
  Blockmap,
  Reject,
} from './types';
import { calculateBoundingBox } from './types';

/**
 * Parse map data from WAD file
 */
export function parseMap(wad: WadFile, mapName: string): MapData | null {
  // Find the map marker lump
  const mapLump = findLump(wad, mapName);
  if (!mapLump) {
    console.error(`Map ${mapName} not found`);
    return null;
  }

  // Find the map lump index
  const mapIndex = wad.lumps.indexOf(mapLump);
  if (mapIndex === -1) {
    return null;
  }

  // Parse all map lumps (they come after the map marker)
  const vertices = parseVertices(wad.lumps[mapIndex + 4]); // VERTEXES
  const sectors = parseSectors(wad.lumps[mapIndex + 8]); // SECTORS
  const sidedefs = parseSidedefs(wad.lumps[mapIndex + 3]); // SIDEDEFS
  const linedefs = parseLinedefs(wad.lumps[mapIndex + 2]); // LINEDEFS
  const segs = parseSegs(wad.lumps[mapIndex + 5]); // SEGS
  const subsectors = parseSubsectors(wad.lumps[mapIndex + 6]); // SSECTORS
  const nodes = parseNodes(wad.lumps[mapIndex + 7]); // NODES
  const blockmap = parseBlockmap(wad.lumps[mapIndex + 10]); // BLOCKMAP
  const reject = parseReject(wad.lumps[mapIndex + 9], sectors.length); // REJECT

  return {
    name: mapName,
    vertices,
    sectors,
    sidedefs,
    linedefs,
    segs,
    subsectors,
    nodes,
    blockmap,
    reject,
    boundingBox: calculateBoundingBox(vertices),
  };
}

/**
 * Parse VERTEXES lump
 */
function parseVertices(lump: WadLump): Vertex[] {
  const data = new DataView(lump.data);
  const count = lump.size / 4; // Each vertex is 4 bytes (2 shorts)
  const vertices: Vertex[] = [];

  for (let i = 0; i < count; i++) {
    vertices.push({
      x: data.getInt16(i * 4, true),
      y: data.getInt16(i * 4 + 2, true),
    });
  }

  return vertices;
}

/**
 * Parse SECTORS lump
 */
function parseSectors(lump: WadLump): Sector[] {
  const data = new DataView(lump.data);
  const count = lump.size / 26; // Each sector is 26 bytes
  const sectors: Sector[] = [];

  for (let i = 0; i < count; i++) {
    const offset = i * 26;
    const floorHeight = data.getInt16(offset, true);
    const ceilingHeight = data.getInt16(offset + 2, true);

    // Read texture names (8 bytes each, null-terminated)
    const floorTexture = readString(lump.data, offset + 4, 8);
    const ceilingTexture = readString(lump.data, offset + 12, 8);

    const lightLevel = data.getInt16(offset + 20, true);
    const specialType = data.getInt16(offset + 22, true);
    const tag = data.getInt16(offset + 24, true);

    sectors.push({
      floorHeight,
      ceilingHeight,
      floorTexture,
      ceilingTexture,
      lightLevel,
      specialType,
      tag,
    });
  }

  return sectors;
}

/**
 * Parse SIDEDEFS lump
 */
function parseSidedefs(lump: WadLump): Sidedef[] {
  const data = new DataView(lump.data);
  const count = lump.size / 30; // Each sidedef is 30 bytes
  const sidedefs: Sidedef[] = [];

  for (let i = 0; i < count; i++) {
    const offset = i * 30;
    const xOffset = data.getInt16(offset, true);
    const yOffset = data.getInt16(offset + 2, true);

    // Read texture names
    const upperTexture = readString(lump.data, offset + 4, 8);
    const lowerTexture = readString(lump.data, offset + 12, 8);
    const middleTexture = readString(lump.data, offset + 20, 8);

    const sector = data.getInt16(offset + 28, true);

    sidedefs.push({
      xOffset,
      yOffset,
      upperTexture,
      lowerTexture,
      middleTexture,
      sector,
    });
  }

  return sidedefs;
}

/**
 * Parse LINEDEFS lump
 */
function parseLinedefs(lump: WadLump): Linedef[] {
  const data = new DataView(lump.data);
  const count = lump.size / 14; // Each linedef is 14 bytes
  const linedefs: Linedef[] = [];

  for (let i = 0; i < count; i++) {
    const offset = i * 14;
    linedefs.push({
      startVertex: data.getInt16(offset, true),
      endVertex: data.getInt16(offset + 2, true),
      flags: data.getInt16(offset + 4, true),
      specialType: data.getInt16(offset + 6, true),
      sectorTag: data.getInt16(offset + 8, true),
      rightSidedef: data.getInt16(offset + 10, true),
      leftSidedef: data.getInt16(offset + 12, true),
    });
  }

  return linedefs;
}

/**
 * Parse SEGS lump
 */
function parseSegs(lump: WadLump): Seg[] {
  const data = new DataView(lump.data);
  const count = lump.size / 12; // Each seg is 12 bytes
  const segs: Seg[] = [];

  for (let i = 0; i < count; i++) {
    const offset = i * 12;
    segs.push({
      startVertex: data.getInt16(offset, true),
      endVertex: data.getInt16(offset + 2, true),
      angle: data.getInt16(offset + 4, true),
      linedef: data.getInt16(offset + 6, true),
      direction: data.getInt16(offset + 8, true),
      offset: data.getInt16(offset + 10, true),
    });
  }

  return segs;
}

/**
 * Parse SSECTORS lump
 */
function parseSubsectors(lump: WadLump): Subsector[] {
  const data = new DataView(lump.data);
  const count = lump.size / 4; // Each subsector is 4 bytes
  const subsectors: Subsector[] = [];

  for (let i = 0; i < count; i++) {
    const offset = i * 4;
    subsectors.push({
      segCount: data.getInt16(offset, true),
      firstSeg: data.getInt16(offset + 2, true),
    });
  }

  return subsectors;
}

/**
 * Parse NODES lump
 */
function parseNodes(lump: WadLump): Node[] {
  const data = new DataView(lump.data);
  const count = lump.size / 28; // Each node is 28 bytes
  const nodes: Node[] = [];

  for (let i = 0; i < count; i++) {
    const offset = i * 28;
    nodes.push({
      x: data.getInt16(offset, true),
      y: data.getInt16(offset + 2, true),
      dx: data.getInt16(offset + 4, true),
      dy: data.getInt16(offset + 6, true),
      rightBox: {
        minY: data.getInt16(offset + 8, true),
        maxY: data.getInt16(offset + 10, true),
        minX: data.getInt16(offset + 12, true),
        maxX: data.getInt16(offset + 14, true),
      },
      leftBox: {
        minY: data.getInt16(offset + 16, true),
        maxY: data.getInt16(offset + 18, true),
        minX: data.getInt16(offset + 20, true),
        maxX: data.getInt16(offset + 22, true),
      },
      rightChild: data.getInt16(offset + 24, true),
      leftChild: data.getInt16(offset + 26, true),
    });
  }

  return nodes;
}

/**
 * Parse BLOCKMAP lump
 */
function parseBlockmap(lump: WadLump): Blockmap {
  const data = new DataView(lump.data);

  const originX = data.getInt16(0, true);
  const originY = data.getInt16(2, true);
  const columns = data.getInt16(4, true);
  const rows = data.getInt16(6, true);

  const blockLists: number[][] = [];

  // Read block lists
  for (let i = 0; i < columns * rows; i++) {
    const offset = data.getInt16(8 + i * 2, true) * 2;
    const blockList: number[] = [];

    if (offset < lump.size) {
      let pos = offset;
      // Skip first entry (always 0)
      data.getInt16(pos, true);
      pos += 2;

      // Read linedef indices until we hit -1
      while (pos < lump.size) {
        const linedef = data.getInt16(pos, true);
        if (linedef === -1) break;
        blockList.push(linedef);
        pos += 2;
      }
    }

    blockLists.push(blockList);
  }

  return {
    originX,
    originY,
    columns,
    rows,
    blockLists,
  };
}

/**
 * Parse REJECT lump
 */
function parseReject(lump: WadLump, sectorCount: number): Reject {
  return {
    data: new Uint8Array(lump.data),
    sectorCount,
  };
}

/**
 * Read a null-terminated string from ArrayBuffer
 */
function readString(buffer: ArrayBuffer, offset: number, maxLength: number): string {
  const view = new Uint8Array(buffer, offset, maxLength);
  let length = 0;
  while (length < maxLength && view[length] !== 0) {
    length++;
  }
  return String.fromCharCode(...Array.from(view.slice(0, length)));
}

/**
 * Get all available map names from WAD
 */
export function getMapNames(wad: WadFile): string[] {
  const mapNames: string[] = [];

  // DOOM 1 style: ExMy (Episode x Map y)
  for (let e = 1; e <= 4; e++) {
    for (let m = 1; m <= 9; m++) {
      const name = `E${e}M${m}`;
      if (findLump(wad, name)) {
        mapNames.push(name);
      }
    }
  }

  // DOOM 2 style: MAPxx
  for (let i = 1; i <= 32; i++) {
    const name = `MAP${String(i).padStart(2, '0')}`;
    if (findLump(wad, name)) {
      mapNames.push(name);
    }
  }

  return mapNames;
}
