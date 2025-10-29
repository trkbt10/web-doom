/**
 * WAD File Decoder
 *
 * Parses binary WAD files into structured TypeScript objects
 */

import type {
  WadFile,
  WadHeader,
  WadDirectoryEntry,
  WadLump,
  WadDecodeOptions,
  WadType,
} from './types';

/**
 * Decode WAD header from buffer
 */
export function decodeHeader(buffer: ArrayBuffer): WadHeader {
  const view = new DataView(buffer);
  const decoder = new TextDecoder('ascii');

  // Read identification (4 bytes)
  const identBytes = new Uint8Array(buffer, 0, 4);
  const identification = decoder.decode(identBytes).trim() as WadType;

  if (identification !== 'IWAD' && identification !== 'PWAD') {
    throw new Error(`Invalid WAD identification: ${identification}`);
  }

  // Read numlumps (4 bytes, little-endian)
  const numlumps = view.getInt32(4, true);

  // Read infotableofs (4 bytes, little-endian)
  const infotableofs = view.getInt32(8, true);

  return {
    identification,
    numlumps,
    infotableofs,
  };
}

/**
 * Decode directory entry from buffer at specified offset
 */
export function decodeDirectoryEntry(
  buffer: ArrayBuffer,
  offset: number
): WadDirectoryEntry {
  const view = new DataView(buffer);
  const decoder = new TextDecoder('ascii');

  // Read filepos (4 bytes, little-endian)
  const filepos = view.getInt32(offset, true);

  // Read size (4 bytes, little-endian)
  const size = view.getInt32(offset + 4, true);

  // Read name (8 bytes, ASCII, null-padded)
  const nameBytes = new Uint8Array(buffer, offset + 8, 8);
  const name = decoder
    .decode(nameBytes)
    .replace(/\0/g, '')
    .trim();

  return {
    filepos,
    size,
    name,
  };
}

/**
 * Decode all directory entries
 */
export function decodeDirectory(
  buffer: ArrayBuffer,
  header: WadHeader
): WadDirectoryEntry[] {
  const entries: WadDirectoryEntry[] = [];

  for (let i = 0; i < header.numlumps; i++) {
    const offset = header.infotableofs + i * 16;
    entries.push(decodeDirectoryEntry(buffer, offset));
  }

  return entries;
}

/**
 * Decode lump data
 */
export function decodeLump(
  buffer: ArrayBuffer,
  entry: WadDirectoryEntry
): WadLump {
  // Extract lump data
  const data = buffer.slice(entry.filepos, entry.filepos + entry.size);

  return {
    name: entry.name,
    data,
    filepos: entry.filepos,
    size: entry.size,
  };
}

/**
 * Decode complete WAD file
 */
export function decode(
  buffer: ArrayBuffer,
  options: WadDecodeOptions = {}
): WadFile {
  const { validate = true, loadData = true } = options;

  // Validate minimum size
  if (buffer.byteLength < 12) {
    throw new Error('Invalid WAD file: too small');
  }

  // Decode header
  const header = decodeHeader(buffer);

  // Decode directory
  const directory = decodeDirectory(buffer, header);

  // Validate directory if requested
  if (validate) {
    const expectedDirEnd = header.infotableofs + header.numlumps * 16;
    if (expectedDirEnd > buffer.byteLength) {
      throw new Error('Invalid WAD file: directory extends beyond file');
    }
  }

  // Decode lumps
  const lumps: WadLump[] = [];

  if (loadData) {
    for (const entry of directory) {
      // Validate lump boundaries if requested
      if (validate) {
        const lumpEnd = entry.filepos + entry.size;
        if (lumpEnd > buffer.byteLength) {
          throw new Error(
            `Invalid WAD file: lump "${entry.name}" extends beyond file`
          );
        }
      }

      lumps.push(decodeLump(buffer, entry));
    }
  } else {
    // Create empty lumps with metadata only
    for (const entry of directory) {
      lumps.push({
        name: entry.name,
        data: new ArrayBuffer(0),
        filepos: entry.filepos,
        size: entry.size,
      });
    }
  }

  return {
    header,
    directory,
    lumps,
  };
}
