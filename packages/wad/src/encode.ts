/**
 * WAD File Encoder
 *
 * Converts structured WAD objects into binary format
 */

import type {
  WadFile,
  WadHeader,
  WadDirectoryEntry,
  WadLump,
  WadEncodeOptions,
  WadType,
} from './types';

/**
 * Encode WAD header to buffer
 */
export function encodeHeader(header: WadHeader): ArrayBuffer {
  const buffer = new ArrayBuffer(12);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();

  // Write identification (4 bytes)
  const identBytes = encoder.encode(header.identification);
  new Uint8Array(buffer, 0, 4).set(identBytes);

  // Write numlumps (4 bytes, little-endian)
  view.setInt32(4, header.numlumps, true);

  // Write infotableofs (4 bytes, little-endian)
  view.setInt32(8, header.infotableofs, true);

  return buffer;
}

/**
 * Encode directory entry to buffer
 */
export function encodeDirectoryEntry(entry: WadDirectoryEntry): ArrayBuffer {
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();

  // Write filepos (4 bytes, little-endian)
  view.setInt32(0, entry.filepos, true);

  // Write size (4 bytes, little-endian)
  view.setInt32(4, entry.size, true);

  // Write name (8 bytes, ASCII, null-padded)
  const nameBytes = new Uint8Array(8);
  const encodedName = encoder.encode(entry.name.slice(0, 8).toUpperCase());
  nameBytes.set(encodedName);
  new Uint8Array(buffer, 8, 8).set(nameBytes);

  return buffer;
}

/**
 * Encode complete directory
 */
export function encodeDirectory(directory: WadDirectoryEntry[]): ArrayBuffer {
  const buffers = directory.map(encodeDirectoryEntry);
  const totalSize = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);

  const result = new ArrayBuffer(totalSize);
  const resultView = new Uint8Array(result);

  let offset = 0;
  for (const buffer of buffers) {
    resultView.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return result;
}

/**
 * Calculate directory entries from lumps
 */
export function calculateDirectory(lumps: WadLump[]): WadDirectoryEntry[] {
  const directory: WadDirectoryEntry[] = [];
  let currentOffset = 12; // Start after header

  for (const lump of lumps) {
    directory.push({
      filepos: currentOffset,
      size: lump.data.byteLength,
      name: lump.name,
    });
    currentOffset += lump.data.byteLength;
  }

  return directory;
}

/**
 * Encode complete WAD file
 */
export function encode(
  wad: Partial<WadFile> & { lumps: WadLump[] },
  options: WadEncodeOptions = {}
): ArrayBuffer {
  const { type = 'PWAD', optimize = true } = options;

  // Calculate directory if not provided
  const directory = wad.directory || calculateDirectory(wad.lumps);

  // Calculate data size
  let dataSize = 0;
  for (const lump of wad.lumps) {
    dataSize += lump.data.byteLength;
  }

  // Calculate directory offset
  const infotableofs = 12 + dataSize;

  // Create header
  const header: WadHeader = wad.header || {
    identification: type,
    numlumps: wad.lumps.length,
    infotableofs,
  };

  // Recalculate directory with correct offsets if optimizing
  let finalDirectory = directory;
  if (optimize) {
    finalDirectory = calculateDirectory(wad.lumps);
  }

  // Update header with final values
  header.numlumps = wad.lumps.length;
  header.infotableofs = 12 + dataSize;

  // Calculate total size
  const totalSize = 12 + dataSize + finalDirectory.length * 16;

  // Create output buffer
  const buffer = new ArrayBuffer(totalSize);
  const view = new Uint8Array(buffer);

  // Write header
  const headerBuffer = encodeHeader(header);
  view.set(new Uint8Array(headerBuffer), 0);

  // Write lump data
  let offset = 12;
  for (const lump of wad.lumps) {
    view.set(new Uint8Array(lump.data), offset);
    offset += lump.data.byteLength;
  }

  // Write directory
  const directoryBuffer = encodeDirectory(finalDirectory);
  view.set(new Uint8Array(directoryBuffer), offset);

  return buffer;
}

/**
 * Create a new empty WAD file
 */
export function createEmptyWad(type: WadType = 'PWAD'): WadFile {
  return {
    header: {
      identification: type,
      numlumps: 0,
      infotableofs: 12,
    },
    directory: [],
    lumps: [],
  };
}

/**
 * Add a lump to WAD file
 */
export function addLump(wad: WadFile, name: string, data: ArrayBuffer): WadFile {
  const newLump: WadLump = {
    name: name.slice(0, 8).toUpperCase(),
    data,
    filepos: 0, // Will be recalculated during encode
    size: data.byteLength,
  };

  return {
    ...wad,
    lumps: [...wad.lumps, newLump],
    header: {
      ...wad.header,
      numlumps: wad.lumps.length + 1,
    },
  };
}

/**
 * Remove a lump from WAD file by name
 */
export function removeLump(wad: WadFile, name: string): WadFile {
  const lumps = wad.lumps.filter((lump) => lump.name !== name.toUpperCase());

  return {
    ...wad,
    lumps,
    header: {
      ...wad.header,
      numlumps: lumps.length,
    },
  };
}

/**
 * Replace a lump in WAD file
 */
export function replaceLump(
  wad: WadFile,
  name: string,
  data: ArrayBuffer
): WadFile {
  const upperName = name.toUpperCase();
  const lumps = wad.lumps.map((lump) =>
    lump.name === upperName
      ? {
          ...lump,
          data,
          size: data.byteLength,
        }
      : lump
  );

  return {
    ...wad,
    lumps,
  };
}
