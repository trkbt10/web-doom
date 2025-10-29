/**
 * WAD Viewer - Interactive WAD file viewer and analyzer
 *
 * Re-exports core WAD functionality with backward compatibility
 */

// Re-export everything from @web-doom/wad
export * from '@web-doom/wad';

// Backward compatibility: re-export with old names
import { decode, type WadFile as WadFileType } from '@web-doom/wad';

/**
 * @deprecated Use decode() from @web-doom/wad instead
 */
export function parseWadHeader(buffer: ArrayBuffer) {
  const wad = decode(buffer);
  return {
    type: wad.header.identification,
    numLumps: wad.header.numlumps,
    directoryOffset: wad.header.infotableofs,
  };
}

/**
 * @deprecated Use decode() from @web-doom/wad instead
 */
export function parseWadDirectory(
  buffer: ArrayBuffer,
  _header: { numLumps: number; directoryOffset: number }
) {
  const wad = decode(buffer);
  return wad.directory.map((entry: any) => ({
    offset: entry.filepos,
    size: entry.size,
    name: entry.name,
  }));
}

/**
 * Legacy WadFile class for backward compatibility
 * @deprecated Use decode() function from @web-doom/wad instead
 */
export class WadFile {
  private wad: WadFileType;

  constructor(buffer: ArrayBuffer) {
    this.wad = decode(buffer);
  }

  get header() {
    return {
      type: this.wad.header.identification,
      numLumps: this.wad.header.numlumps,
      directoryOffset: this.wad.header.infotableofs,
    };
  }

  get lumps() {
    return this.wad.directory.map((entry: any) => ({
      offset: entry.filepos,
      size: entry.size,
      name: entry.name,
    }));
  }

  getLump(name: string): ArrayBuffer | null {
    const lump = this.wad.lumps.find((l: any) => l.name === name.toUpperCase());
    return lump ? lump.data : null;
  }

  getLumpByIndex(index: number): ArrayBuffer | null {
    const lump = this.wad.lumps[index];
    return lump ? lump.data : null;
  }
}
