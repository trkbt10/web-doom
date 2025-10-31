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
  isValidTextureLump,
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

// Image test helpers
export {
  createTestPicture,
  comparePictures,
  testPictureRoundTrip,
  testCanvasRoundTrip,
  runAllRoundTripTests,
  createSimpleTestPicture,
  createTransparentTestPicture,
} from './image-test-helpers';

// Picture format
export type {
  DoomPictureHeader,
  DoomPicturePost,
  DoomPictureColumn,
  DoomPicture,
} from './picture';

export {
  decodePictureHeader,
  decodePictureColumn,
  decodePicture,
  encodePictureHeader,
  encodePictureColumn,
  encodePicture,
  pixelsToColumns,
  createPicture,
} from './picture';

// Composite textures (TEXTURE1/TEXTURE2)
export type {
  TexturePatch,
  TextureDefinition,
} from './texture';

export {
  parsePNames,
  parseTextureLump,
  parseTextures,
  buildCompositeTexture,
} from './texture';

// Image conversion
export type {
  PictureToCanvasOptions,
  CanvasToPictureOptions,
} from './image-converter';

export {
  DEFAULT_DOOM_PALETTE,
  pictureToImageData,
  pictureToCanvas,
  canvasToPicture,
  loadImageToCanvas,
  loadFileToCanvas,
  canvasToPNG,
  canvasToDataURL,
  pictureLumpToDataURL,
  pngFileToPictureLump,
  parsePaletteFromPLAYPAL,
} from './image-converter';

// Audio types
export type {
  DmxSoundHeader,
  DmxSound,
  MusHeader,
  MusEvent,
  MusFile,
  AudioPlayerState,
  AudioDecodeOptions,
} from './audio-types';

export { MusEventType } from './audio-types';

// Audio sound effects (DMX/PC Speaker)
export {
  decodeSoundHeader,
  decodeSound,
  soundToFloat32,
  getSoundDuration,
  isSoundFormat,
} from './audio-sound';

// Audio music (MUS format)
export {
  decodeMusHeader,
  decodeMusEvents,
  decodeMus,
  isMusFormat,
  musNoteToMidi,
  getMusControllerName,
  MUS_TO_MIDI_NOTE_MAP,
} from './audio-mus';

// Audio players (WebAudio)
export { DmxSoundPlayer, AudioManager } from './audio-player';
export { MusPlayer } from './audio-mus-player';
