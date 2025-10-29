/**
 * WAD File Format Type Definitions
 *
 * Reference: DOOM WAD file specification
 * - Header: 12 bytes (identification + numlumps + infotableofs)
 * - Directory: 16 bytes per lump (filepos + size + name)
 * - Lumps: Variable size data blocks
 */

/**
 * WAD file type - IWAD (Internal) or PWAD (Patch)
 */
export type WadType = 'IWAD' | 'PWAD';

/**
 * WAD file header (12 bytes)
 */
export interface WadHeader {
  /** WAD type identifier ('IWAD' or 'PWAD') */
  identification: WadType;
  /** Number of lumps in the directory */
  numlumps: number;
  /** File offset to the directory */
  infotableofs: number;
}

/**
 * Directory entry for a single lump (16 bytes)
 */
export interface WadDirectoryEntry {
  /** File offset to lump data */
  filepos: number;
  /** Size of lump data in bytes */
  size: number;
  /** Lump name (up to 8 ASCII characters) */
  name: string;
}

/**
 * Lump data with its metadata
 */
export interface WadLump {
  /** Lump name */
  name: string;
  /** Lump data as ArrayBuffer */
  data: ArrayBuffer;
  /** Original file position */
  filepos: number;
  /** Data size in bytes */
  size: number;
}

/**
 * Complete WAD file structure
 */
export interface WadFile {
  /** WAD header */
  header: WadHeader;
  /** Directory entries */
  directory: WadDirectoryEntry[];
  /** Lump data array */
  lumps: WadLump[];
}

/**
 * WAD file metadata for inspection
 */
export interface WadMetadata {
  /** WAD type */
  type: WadType;
  /** Total file size in bytes */
  totalSize: number;
  /** Number of lumps */
  lumpCount: number;
  /** Directory offset */
  directoryOffset: number;
  /** List of lump names */
  lumpNames: string[];
  /** Total data size (excluding header and directory) */
  dataSize: number;
}

/**
 * Validation result
 */
export interface WadValidationResult {
  /** Whether the WAD file is valid */
  valid: boolean;
  /** List of errors if invalid */
  errors: string[];
  /** List of warnings */
  warnings: string[];
}

/**
 * Options for encoding WAD files
 */
export interface WadEncodeOptions {
  /** WAD type (default: 'PWAD') */
  type?: WadType;
  /** Whether to optimize directory placement (default: true) */
  optimize?: boolean;
}

/**
 * Options for decoding WAD files
 */
export interface WadDecodeOptions {
  /** Whether to validate the WAD structure (default: true) */
  validate?: boolean;
  /** Whether to load all lump data into memory (default: true) */
  loadData?: boolean;
}
