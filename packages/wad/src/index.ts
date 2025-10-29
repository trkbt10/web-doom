/**
 * @web-doom/wad
 *
 * Complete WAD file encoder/decoder library for DOOM
 *
 * Features:
 * - Full WAD file parsing (decode)
 * - WAD file creation and modification (encode)
 * - Type-safe WAD structure definitions
 * - Validation and verification utilities
 * - Structure visualization and inspection
 * - Test helpers for development
 *
 * @example Basic usage
 * ```typescript
 * import { decode, encode, validate, printStructure } from '@web-doom/wad';
 *
 * // Decode a WAD file
 * const wad = decode(arrayBuffer);
 *
 * // Validate the structure
 * const result = validate(wad);
 * if (!result.valid) {
 *   console.error('Errors:', result.errors);
 * }
 *
 * // Print structure
 * console.log(printStructure(wad));
 *
 * // Modify and re-encode
 * const modifiedWad = addLump(wad, 'NEWLUMP', data);
 * const encoded = encode(modifiedWad);
 * ```
 */

// Types
export type {
  WadType,
  WadHeader,
  WadDirectoryEntry,
  WadLump,
  WadFile,
  WadMetadata,
  WadValidationResult,
  WadEncodeOptions,
  WadDecodeOptions,
} from './types';

// Decode functions
export {
  decode,
  decodeHeader,
  decodeDirectory,
  decodeDirectoryEntry,
  decodeLump,
} from './decode';

// Encode functions
export {
  encode,
  encodeHeader,
  encodeDirectory,
  encodeDirectoryEntry,
  calculateDirectory,
  createEmptyWad,
  addLump,
  removeLump,
  replaceLump,
} from './encode';

// Utility functions
export {
  getMetadata,
  validate,
  findLump,
  findLumps,
  getLumpByIndex,
  hasLump,
  getLumpText,
  getLumpHex,
  formatSize,
  printStructure,
  toJSON,
  getStatistics,
  createMemoryMap,
} from './utils';

// Test helpers
export {
  createTestWad,
  createWadWithLumps,
  testRoundTrip,
  compareWads,
  createMinimalWad,
  verifyWad,
} from './test-helpers';
