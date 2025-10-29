/**
 * WAD Viewer - DOOM WAD file parser and viewer
 */

export interface WadHeader {
  type: 'IWAD' | 'PWAD';
  numLumps: number;
  directoryOffset: number;
}

export interface WadLump {
  offset: number;
  size: number;
  name: string;
}

/**
 * Parse WAD file header
 */
export function parseWadHeader(buffer: ArrayBuffer): WadHeader {
  const view = new DataView(buffer);
  const decoder = new TextDecoder('ascii');

  const typeBytes = new Uint8Array(buffer, 0, 4);
  const type = decoder.decode(typeBytes) as 'IWAD' | 'PWAD';
  const numLumps = view.getInt32(4, true);
  const directoryOffset = view.getInt32(8, true);

  return { type, numLumps, directoryOffset };
}

/**
 * Parse WAD directory
 */
export function parseWadDirectory(buffer: ArrayBuffer, header: WadHeader): WadLump[] {
  const view = new DataView(buffer);
  const decoder = new TextDecoder('ascii');
  const lumps: WadLump[] = [];

  for (let i = 0; i < header.numLumps; i++) {
    const entryOffset = header.directoryOffset + i * 16;
    const offset = view.getInt32(entryOffset, true);
    const size = view.getInt32(entryOffset + 4, true);
    const nameBytes = new Uint8Array(buffer, entryOffset + 8, 8);
    const name = decoder.decode(nameBytes).replace(/\0/g, '').trim();

    lumps.push({ offset, size, name });
  }

  return lumps;
}

/**
 * Main WAD file parser class
 */
export class WadFile {
  private buffer: ArrayBuffer;
  public header: WadHeader;
  public lumps: WadLump[];

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.header = parseWadHeader(buffer);
    this.lumps = parseWadDirectory(buffer, this.header);
  }

  /**
   * Get lump data by name
   */
  getLump(name: string): ArrayBuffer | null {
    const lump = this.lumps.find(l => l.name === name);
    if (!lump) return null;
    return this.buffer.slice(lump.offset, lump.offset + lump.size);
  }

  /**
   * Get lump data by index
   */
  getLumpByIndex(index: number): ArrayBuffer | null {
    const lump = this.lumps[index];
    if (!lump) return null;
    return this.buffer.slice(lump.offset, lump.offset + lump.size);
  }
}
