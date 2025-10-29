/**
 * WAD Test Helpers
 *
 * Utilities for testing and creating sample WAD files
 */

import type { WadFile, WadLump, WadType } from './types';
import { encode } from './encode';
import { decode } from './decode';

/**
 * Create a simple test WAD file
 */
export function createTestWad(type: WadType = 'PWAD'): WadFile {
  const encoder = new TextEncoder();

  const lumps: WadLump[] = [
    {
      name: 'TEST1',
      data: encoder.encode('Hello, DOOM!').buffer,
      filepos: 12,
      size: 12,
    },
    {
      name: 'TEST2',
      data: encoder.encode('This is test data').buffer,
      filepos: 24,
      size: 17,
    },
    {
      name: 'MARKER',
      data: new ArrayBuffer(0),
      filepos: 41,
      size: 0,
    },
  ];

  return {
    header: {
      identification: type,
      numlumps: lumps.length,
      infotableofs: 41,
    },
    directory: lumps.map((lump) => ({
      filepos: lump.filepos,
      size: lump.size,
      name: lump.name,
    })),
    lumps,
  };
}

/**
 * Create WAD with specific lumps
 */
export function createWadWithLumps(
  lumps: Array<{ name: string; data: string | ArrayBuffer }>,
  type: WadType = 'PWAD'
): WadFile {
  const encoder = new TextEncoder();

  const wadLumps: WadLump[] = lumps.map((lump, i) => {
    const data =
      typeof lump.data === 'string'
        ? encoder.encode(lump.data).buffer
        : lump.data;

    return {
      name: lump.name.slice(0, 8).toUpperCase(),
      data,
      filepos: 0, // Will be calculated during encode
      size: data.byteLength,
    };
  });

  // Calculate file positions
  let offset = 12; // After header
  wadLumps.forEach((lump) => {
    lump.filepos = offset;
    offset += lump.size;
  });

  return {
    header: {
      identification: type,
      numlumps: wadLumps.length,
      infotableofs: offset,
    },
    directory: wadLumps.map((lump) => ({
      filepos: lump.filepos,
      size: lump.size,
      name: lump.name,
    })),
    lumps: wadLumps,
  };
}

/**
 * Test encode/decode round-trip
 */
export function testRoundTrip(wad: WadFile): {
  success: boolean;
  originalSize: number;
  encodedSize: number;
  decodedSize: number;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Encode
    const encoded = encode(wad);
    const encodedSize = encoded.byteLength;

    // Decode
    const decoded = decode(encoded);
    const decodedSize = encoded.byteLength;

    // Compare
    if (wad.header.identification !== decoded.header.identification) {
      errors.push('Header identification mismatch');
    }

    if (wad.lumps.length !== decoded.lumps.length) {
      errors.push('Lump count mismatch');
    }

    // Compare each lump
    for (let i = 0; i < Math.min(wad.lumps.length, decoded.lumps.length); i++) {
      const original = wad.lumps[i];
      const decoded_lump = decoded.lumps[i];

      if (original.name !== decoded_lump.name) {
        errors.push(`Lump ${i} name mismatch: ${original.name} !== ${decoded_lump.name}`);
      }

      if (original.size !== decoded_lump.size) {
        errors.push(`Lump ${i} size mismatch: ${original.size} !== ${decoded_lump.size}`);
      }

      // Compare data
      const originalBytes = new Uint8Array(original.data);
      const decodedBytes = new Uint8Array(decoded_lump.data);

      if (originalBytes.length !== decodedBytes.length) {
        errors.push(`Lump ${i} data length mismatch`);
      } else {
        for (let j = 0; j < originalBytes.length; j++) {
          if (originalBytes[j] !== decodedBytes[j]) {
            errors.push(`Lump ${i} data mismatch at byte ${j}`);
            break;
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      originalSize: 12 + wad.lumps.reduce((s, l) => s + l.size, 0) + wad.directory.length * 16,
      encodedSize,
      decodedSize,
      errors,
    };
  } catch (error) {
    errors.push(`Exception: ${error}`);
    return {
      success: false,
      originalSize: 0,
      encodedSize: 0,
      decodedSize: 0,
      errors,
    };
  }
}

/**
 * Compare two WAD files
 */
export function compareWads(
  wad1: WadFile,
  wad2: WadFile
): {
  identical: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  // Compare headers
  if (wad1.header.identification !== wad2.header.identification) {
    differences.push(
      `Header type: ${wad1.header.identification} !== ${wad2.header.identification}`
    );
  }

  if (wad1.header.numlumps !== wad2.header.numlumps) {
    differences.push(
      `Lump count: ${wad1.header.numlumps} !== ${wad2.header.numlumps}`
    );
  }

  // Compare lumps
  const minLumps = Math.min(wad1.lumps.length, wad2.lumps.length);

  for (let i = 0; i < minLumps; i++) {
    const lump1 = wad1.lumps[i];
    const lump2 = wad2.lumps[i];

    if (lump1.name !== lump2.name) {
      differences.push(`Lump ${i} name: ${lump1.name} !== ${lump2.name}`);
    }

    if (lump1.size !== lump2.size) {
      differences.push(`Lump ${i} size: ${lump1.size} !== ${lump2.size}`);
    }

    // Compare data
    const bytes1 = new Uint8Array(lump1.data);
    const bytes2 = new Uint8Array(lump2.data);

    if (bytes1.length === bytes2.length) {
      for (let j = 0; j < bytes1.length; j++) {
        if (bytes1[j] !== bytes2[j]) {
          differences.push(
            `Lump ${i} (${lump1.name}) data differs at byte ${j}`
          );
          break;
        }
      }
    }
  }

  if (wad1.lumps.length !== wad2.lumps.length) {
    differences.push(
      `WAD1 has ${wad1.lumps.length} lumps, WAD2 has ${wad2.lumps.length} lumps`
    );
  }

  return {
    identical: differences.length === 0,
    differences,
  };
}

/**
 * Create a minimal valid WAD file
 */
export function createMinimalWad(): WadFile {
  return {
    header: {
      identification: 'PWAD',
      numlumps: 0,
      infotableofs: 12,
    },
    directory: [],
    lumps: [],
  };
}

/**
 * Verify WAD can be encoded and decoded
 */
export function verifyWad(wad: WadFile): boolean {
  try {
    const encoded = encode(wad);
    const decoded = decode(encoded);
    const result = compareWads(wad, decoded);
    return result.identical;
  } catch {
    return false;
  }
}
