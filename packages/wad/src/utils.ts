/**
 * WAD Utility Functions
 *
 * Utilities for inspecting, validating, and visualizing WAD files
 */

import type {
  WadFile,
  WadLump,
  WadMetadata,
  WadValidationResult,
} from './types';

/**
 * Get WAD file metadata
 */
export function getMetadata(wad: WadFile): WadMetadata {
  const dataSize = wad.lumps.reduce((sum, lump) => sum + lump.size, 0);
  const totalSize = 12 + dataSize + wad.directory.length * 16;

  return {
    type: wad.header.identification,
    totalSize,
    lumpCount: wad.header.numlumps,
    directoryOffset: wad.header.infotableofs,
    lumpNames: wad.lumps.map((lump) => lump.name),
    dataSize,
  };
}

/**
 * Validate WAD file structure
 */
export function validate(wad: WadFile): WadValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check header
  if (
    wad.header.identification !== 'IWAD' &&
    wad.header.identification !== 'PWAD'
  ) {
    errors.push(
      `Invalid identification: ${wad.header.identification}`
    );
  }

  if (wad.header.numlumps < 0) {
    errors.push(`Invalid numlumps: ${wad.header.numlumps}`);
  }

  if (wad.header.numlumps !== wad.lumps.length) {
    errors.push(
      `Numlumps mismatch: header=${wad.header.numlumps}, actual=${wad.lumps.length}`
    );
  }

  if (wad.header.numlumps !== wad.directory.length) {
    errors.push(
      `Directory size mismatch: header=${wad.header.numlumps}, actual=${wad.directory.length}`
    );
  }

  // Check directory entries match lumps
  for (let i = 0; i < Math.min(wad.directory.length, wad.lumps.length); i++) {
    const entry = wad.directory[i];
    const lump = wad.lumps[i];

    if (entry.name !== lump.name) {
      errors.push(
        `Name mismatch at index ${i}: directory="${entry.name}", lump="${lump.name}"`
      );
    }

    if (entry.size !== lump.size) {
      warnings.push(
        `Size mismatch for "${entry.name}": directory=${entry.size}, lump=${lump.size}`
      );
    }
  }

  // Check for duplicate lump names
  const names = new Set<string>();
  for (const lump of wad.lumps) {
    if (names.has(lump.name)) {
      warnings.push(`Duplicate lump name: "${lump.name}"`);
    }
    names.add(lump.name);
  }

  // Check lump names are valid (8 chars max, ASCII)
  for (const lump of wad.lumps) {
    if (lump.name.length > 8) {
      errors.push(
        `Lump name too long: "${lump.name}" (${lump.name.length} chars)`
      );
    }

    if (!/^[\x20-\x7E]*$/.test(lump.name)) {
      errors.push(`Lump name contains non-ASCII characters: "${lump.name}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Find lump by name
 */
export function findLump(wad: WadFile, name: string): WadLump | null {
  const upperName = name.toUpperCase();
  return wad.lumps.find((lump) => lump.name === upperName) || null;
}

/**
 * Find all lumps matching a pattern
 */
export function findLumps(wad: WadFile, pattern: RegExp): WadLump[] {
  return wad.lumps.filter((lump) => pattern.test(lump.name));
}

/**
 * Get lump by index
 */
export function getLumpByIndex(wad: WadFile, index: number): WadLump | null {
  return wad.lumps[index] || null;
}

/**
 * Check if lump exists
 */
export function hasLump(wad: WadFile, name: string): boolean {
  return findLump(wad, name) !== null;
}

/**
 * Get lump data as text
 */
export function getLumpText(lump: WadLump): string {
  const decoder = new TextDecoder('ascii');
  return decoder.decode(lump.data);
}

/**
 * Get lump data as hex string
 */
export function getLumpHex(lump: WadLump): string {
  const bytes = new Uint8Array(lump.data);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * Format file size for display
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Print WAD structure as text
 */
export function printStructure(wad: WadFile): string {
  const lines: string[] = [];
  const metadata = getMetadata(wad);

  lines.push('='.repeat(80));
  lines.push('WAD FILE STRUCTURE');
  lines.push('='.repeat(80));
  lines.push('');

  // Header info
  lines.push('HEADER:');
  lines.push(`  Type: ${metadata.type}`);
  lines.push(`  Total Size: ${formatSize(metadata.totalSize)}`);
  lines.push(`  Lump Count: ${metadata.lumpCount}`);
  lines.push(`  Directory Offset: ${metadata.directoryOffset} (0x${metadata.directoryOffset.toString(16).toUpperCase()})`);
  lines.push(`  Data Size: ${formatSize(metadata.dataSize)}`);
  lines.push('');

  // Lumps
  lines.push('LUMPS:');
  lines.push('  IDX  OFFSET      SIZE       NAME');
  lines.push('  ' + '-'.repeat(76));

  wad.lumps.forEach((lump, i) => {
    const idx = i.toString().padStart(4, ' ');
    const offset = lump.filepos.toString().padStart(10, ' ');
    const size = formatSize(lump.size).padStart(10, ' ');
    const name = lump.name.padEnd(8, ' ');
    lines.push(`  ${idx} ${offset} ${size}  ${name}`);
  });

  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Print WAD structure as JSON
 */
export function toJSON(wad: WadFile): string {
  const obj = {
    header: wad.header,
    metadata: getMetadata(wad),
    lumps: wad.lumps.map((lump) => ({
      name: lump.name,
      size: lump.size,
      filepos: lump.filepos,
    })),
  };

  return JSON.stringify(obj, null, 2);
}

/**
 * Print WAD statistics
 */
export function getStatistics(wad: WadFile): Record<string, number | string> {
  const metadata = getMetadata(wad);
  const sizes = wad.lumps.map((l) => l.size);
  const totalSize = sizes.reduce((a, b) => a + b, 0);
  const avgSize = totalSize / wad.lumps.length;
  const maxSize = Math.max(...sizes);
  const minSize = Math.min(...sizes);

  // Count lumps by first character (marker lumps often start with specific chars)
  const markerCount = wad.lumps.filter((l) => l.size === 0).length;

  return {
    'Type': metadata.type,
    'Total Size': formatSize(metadata.totalSize),
    'Lump Count': metadata.lumpCount,
    'Data Size': formatSize(metadata.dataSize),
    'Average Lump Size': formatSize(avgSize),
    'Max Lump Size': formatSize(maxSize),
    'Min Lump Size': formatSize(minSize),
    'Marker Lumps': markerCount,
    'Data Lumps': metadata.lumpCount - markerCount,
  };
}

/**
 * Create a visual map of WAD file layout
 */
export function createMemoryMap(wad: WadFile): string {
  const lines: string[] = [];

  lines.push('MEMORY MAP:');
  lines.push('');
  lines.push(`0x00000000 [HEADER] (12 bytes)`);
  lines.push(`           Type: ${wad.header.identification}`);
  lines.push(`           Lumps: ${wad.header.numlumps}`);
  lines.push(`           Directory: 0x${wad.header.infotableofs.toString(16).toUpperCase()}`);
  lines.push('');

  // Lump data
  wad.lumps.forEach((lump) => {
    const offsetHex = `0x${lump.filepos.toString(16).padStart(8, '0').toUpperCase()}`;
    const sizeStr = formatSize(lump.size);
    lines.push(`${offsetHex} [${lump.name.padEnd(8)}] (${sizeStr})`);
  });

  // Directory
  const dirOffset = wad.header.infotableofs;
  const dirOffsetHex = `0x${dirOffset.toString(16).padStart(8, '0').toUpperCase()}`;
  const dirSize = wad.header.numlumps * 16;
  lines.push('');
  lines.push(`${dirOffsetHex} [DIRECTORY] (${dirSize} bytes, ${wad.header.numlumps} entries)`);

  return lines.join('\n');
}

/**
 * Check if a lump name represents a valid texture/picture that can be replaced
 * This prevents replacing non-picture lumps like DEMO files, map data, etc.
 */
export function isValidTextureLump(lumpName: string): boolean {
  const name = lumpName.toUpperCase();

  // Exclude known non-picture lumps
  const excludedPatterns = [
    'DEMO', // Demo files (DEMO1, DEMO2, DEMO3)
    'THINGS', 'LINEDEFS', 'SIDEDEFS', 'VERTEXES', 'SEGS', 'SSECTORS', 'NODES', 'SECTORS', 'REJECT', 'BLOCKMAP', // Map data
    'PLAYPAL', 'COLORMAP', 'ENDOOM', 'GENMIDI', 'DMXGUS', // System lumps
    'TEXTURE1', 'TEXTURE2', 'PNAMES', // Texture definitions
    'D_', 'DP_', // Music (D_E1M1, etc.)
    'DS_', // Sound effects
  ];

  for (const pattern of excludedPatterns) {
    if (name.startsWith(pattern)) {
      return false;
    }
  }

  return true;
}
