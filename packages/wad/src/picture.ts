/**
 * DOOM Picture Format
 *
 * Handles encoding/decoding of DOOM's picture format (used for sprites, textures, etc.)
 *
 * Format structure:
 * - Header (8 bytes):
 *   - width: int16 (little-endian)
 *   - height: int16 (little-endian)
 *   - leftOffset: int16 (little-endian)
 *   - topOffset: int16 (little-endian)
 * - Column offsets: int32[] (width entries, little-endian)
 * - Column data: variable-length posts
 *
 * Each column consists of posts:
 * - topdelta: uint8 (0xFF = end of column)
 * - length: uint8
 * - unused padding: uint8
 * - pixels: uint8[] (length bytes)
 * - unused padding: uint8
 */

/**
 * DOOM Picture header
 */
export interface DoomPictureHeader {
  width: number;
  height: number;
  leftOffset: number;
  topOffset: number;
}

/**
 * A post within a column (vertical strip of pixels)
 */
export interface DoomPicturePost {
  /** Y offset from top of image */
  topdelta: number;
  /** Pixel data (palette indices) */
  pixels: Uint8Array;
}

/**
 * A column of posts
 */
export type DoomPictureColumn = DoomPicturePost[];

/**
 * Complete DOOM picture with metadata
 */
export interface DoomPicture {
  header: DoomPictureHeader;
  /** Columns of posts (width columns) */
  columns: DoomPictureColumn[];
  /** Raw pixel data as 2D array (height x width), null = transparent */
  pixels: (number | null)[][];
}

/**
 * Decode DOOM picture header
 */
export function decodePictureHeader(buffer: ArrayBuffer): DoomPictureHeader {
  if (buffer.byteLength < 8) {
    throw new Error(`Buffer too small for picture header: ${buffer.byteLength} bytes (need at least 8)`);
  }

  const view = new DataView(buffer);

  return {
    width: view.getInt16(0, true),
    height: view.getInt16(2, true),
    leftOffset: view.getInt16(4, true),
    topOffset: view.getInt16(6, true),
  };
}

/**
 * Decode a single column from picture data
 */
export function decodePictureColumn(
  buffer: ArrayBuffer,
  offset: number
): DoomPictureColumn {
  if (offset >= buffer.byteLength) {
    throw new Error(`Column offset ${offset} is out of bounds (buffer size: ${buffer.byteLength})`);
  }

  const view = new DataView(buffer);
  const posts: DoomPicturePost[] = [];
  let currentOffset = offset;

  while (true) {
    // Check if we can read topdelta
    if (currentOffset >= buffer.byteLength) {
      throw new Error(`Unexpected end of buffer while reading column at offset ${currentOffset}`);
    }

    const topdelta = view.getUint8(currentOffset);

    // 0xFF marks end of column
    if (topdelta === 0xFF) {
      break;
    }

    currentOffset++;

    // Check if we can read length
    if (currentOffset >= buffer.byteLength) {
      throw new Error(`Unexpected end of buffer while reading column length at offset ${currentOffset}`);
    }

    const length = view.getUint8(currentOffset);
    currentOffset++;

    // Skip unused padding byte (dummy byte before pixel data)
    currentOffset++;

    // Check if we can read pixel data
    if (currentOffset + length > buffer.byteLength) {
      throw new Error(`Column pixel data extends beyond buffer bounds at offset ${currentOffset} (length: ${length}, buffer size: ${buffer.byteLength})`);
    }

    // Read pixel data
    const pixels = new Uint8Array(buffer, currentOffset, length);
    currentOffset += length;

    // Skip unused padding byte (dummy byte after pixel data)
    currentOffset++;

    posts.push({
      topdelta,
      pixels: new Uint8Array(pixels), // Copy the data
    });
  }

  return posts;
}

/**
 * Decode complete DOOM picture
 */
export function decodePicture(buffer: ArrayBuffer): DoomPicture {
  const header = decodePictureHeader(buffer);

  // Validate header values - DOOM pictures should have reasonable dimensions
  // Maximum texture size in DOOM is typically 512x512, but we'll allow up to 4096
  const MAX_DIMENSION = 4096;
  if (header.width <= 0 || header.width > MAX_DIMENSION) {
    throw new Error(
      `Invalid picture width: ${header.width} (must be between 1 and ${MAX_DIMENSION})`
    );
  }
  if (header.height <= 0 || header.height > MAX_DIMENSION) {
    throw new Error(
      `Invalid picture height: ${header.height} (must be between 1 and ${MAX_DIMENSION})`
    );
  }

  // Check if buffer has enough space for column offsets
  const minBufferSize = 8 + header.width * 4;
  if (buffer.byteLength < minBufferSize) {
    throw new Error(
      `Buffer too small for picture data: ${buffer.byteLength} bytes ` +
      `(need at least ${minBufferSize} for ${header.width} columns)`
    );
  }

  const view = new DataView(buffer);

  // Read column offsets
  const columnOffsets: number[] = [];
  for (let i = 0; i < header.width; i++) {
    const offset = view.getUint32(8 + i * 4, true);

    // Validate column offset
    if (offset >= buffer.byteLength) {
      throw new Error(
        `Invalid column offset ${offset} for column ${i} (buffer size: ${buffer.byteLength})`
      );
    }

    columnOffsets.push(offset);
  }

  // Decode columns
  const columns: DoomPictureColumn[] = [];
  for (let i = 0; i < columnOffsets.length; i++) {
    const offset = columnOffsets[i];
    try {
      columns.push(decodePictureColumn(buffer, offset));
    } catch (error) {
      throw new Error(
        `Failed to decode column ${i} at offset ${offset}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Convert columns to 2D pixel array
  const pixels: (number | null)[][] = [];
  for (let y = 0; y < header.height; y++) {
    pixels[y] = new Array(header.width).fill(null);
  }

  for (let x = 0; x < header.width; x++) {
    const column = columns[x];
    for (const post of column) {
      for (let i = 0; i < post.pixels.length; i++) {
        const y = post.topdelta + i;
        if (y >= 0 && y < header.height) {
          pixels[y][x] = post.pixels[i];
        }
      }
    }
  }

  return {
    header,
    columns,
    pixels,
  };
}

/**
 * Encode DOOM picture header
 */
export function encodePictureHeader(header: DoomPictureHeader): ArrayBuffer {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  view.setInt16(0, header.width, true);
  view.setInt16(2, header.height, true);
  view.setInt16(4, header.leftOffset, true);
  view.setInt16(6, header.topOffset, true);

  return buffer;
}

/**
 * Encode a single column
 *
 * DOOM picture format for each post:
 * - topdelta: uint8 (y offset)
 * - length: uint8 (number of pixels)
 * - padding: uint8 (dummy byte, usually 0)
 * - pixels: uint8[length] (palette indices)
 * - padding: uint8 (dummy byte, usually 0)
 */
export function encodePictureColumn(column: DoomPictureColumn): Uint8Array {
  const parts: Uint8Array[] = [];

  for (const post of column) {
    const postData = new Uint8Array(4 + post.pixels.length);
    postData[0] = post.topdelta;
    postData[1] = post.pixels.length;
    postData[2] = 0; // padding before pixels
    postData.set(post.pixels, 3);
    postData[3 + post.pixels.length] = 0; // padding after pixels
    parts.push(postData);
  }

  // Add end marker
  parts.push(new Uint8Array([0xFF]));

  // Combine all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

/**
 * Convert 2D pixel array to columns
 */
export function pixelsToColumns(
  pixels: (number | null)[][],
  width: number,
  height: number
): DoomPictureColumn[] {
  const columns: DoomPictureColumn[] = [];

  for (let x = 0; x < width; x++) {
    const posts: DoomPicturePost[] = [];
    let postStart: number | null = null;
    const postPixels: number[] = [];

    for (let y = 0; y < height; y++) {
      const pixel = pixels[y]?.[x];

      if (pixel !== null && pixel !== undefined) {
        if (postStart === null) {
          postStart = y;
        }
        postPixels.push(pixel);
      } else {
        if (postStart !== null && postPixels.length > 0) {
          posts.push({
            topdelta: postStart,
            pixels: new Uint8Array(postPixels),
          });
          postPixels.length = 0;
          postStart = null;
        }
      }
    }

    // Finish last post if any
    if (postStart !== null && postPixels.length > 0) {
      posts.push({
        topdelta: postStart,
        pixels: new Uint8Array(postPixels),
      });
    }

    columns.push(posts);
  }

  return columns;
}

/**
 * Encode complete DOOM picture
 */
export function encodePicture(picture: DoomPicture): ArrayBuffer {
  const header = picture.header;
  const columns = picture.columns;

  // Encode header
  const headerBuffer = encodePictureHeader(header);

  // Encode columns
  const encodedColumns = columns.map(encodePictureColumn);

  // Calculate column offsets
  const columnOffsets: number[] = [];
  let dataOffset = 8 + header.width * 4; // After header and offset table

  for (const encodedColumn of encodedColumns) {
    columnOffsets.push(dataOffset);
    dataOffset += encodedColumn.length;
  }

  // Calculate total size
  const totalSize = dataOffset;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Write header
  bytes.set(new Uint8Array(headerBuffer), 0);

  // Write column offsets
  for (let i = 0; i < columnOffsets.length; i++) {
    view.setUint32(8 + i * 4, columnOffsets[i], true);
  }

  // Write column data
  for (let i = 0; i < encodedColumns.length; i++) {
    bytes.set(encodedColumns[i], columnOffsets[i]);
  }

  return buffer;
}

/**
 * Create DOOM picture from 2D pixel array
 */
export function createPicture(
  pixels: (number | null)[][],
  leftOffset: number = 0,
  topOffset: number = 0
): DoomPicture {
  const height = pixels.length;
  const width = pixels[0]?.length || 0;

  const columns = pixelsToColumns(pixels, width, height);

  return {
    header: {
      width,
      height,
      leftOffset,
      topOffset,
    },
    columns,
    pixels,
  };
}
