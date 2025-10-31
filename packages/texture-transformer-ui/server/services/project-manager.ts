import { mkdir, readdir, readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ProjectMetadata {
  id: string;
  name: string;
  wadFile: string;
  createdAt: string;
  updatedAt: string;
  textureCount: number;
  transformedCount: number;
  description?: string;
  autoSuggestExecuted?: boolean;
  commonPrompt?: string;
}

export interface TextureMetadata {
  name: string;
  category: string;
  originalBase64?: string;
  transformedBase64?: string;
  confirmed: boolean;
  transformHistory: TransformRecord[];
}

export interface TransformRecord {
  timestamp: string;
  prompt: string;
  strength: number;
  steps: number;
  guidanceScale: number;
  seed?: number;
  resultBase64: string;
}

const DATA_ROOT = join(process.cwd(), 'data');

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_ROOT)) {
    await mkdir(DATA_ROOT, { recursive: true });
  }
}

/**
 * Get project directory path
 */
function getProjectDir(projectId: string): string {
  return join(DATA_ROOT, projectId);
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  wadFileBuffer: Buffer,
  originalFileName: string,
  description?: string
): Promise<ProjectMetadata> {
  await ensureDataDir();

  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
  const projectDir = getProjectDir(id);

  await mkdir(projectDir, { recursive: true });
  await mkdir(join(projectDir, 'textures'), { recursive: true });
  await mkdir(join(projectDir, 'originals'), { recursive: true });
  await mkdir(join(projectDir, 'transformed'), { recursive: true });

  // Save the WAD file to the project directory
  const wadFileName = originalFileName.endsWith('.wad') ? originalFileName : `${originalFileName}.wad`;
  const wadFilePath = join(projectDir, wadFileName);
  await writeFile(wadFilePath, wadFileBuffer);

  const metadata: ProjectMetadata = {
    id,
    name,
    wadFile: wadFilePath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    textureCount: 0,
    transformedCount: 0,
    description,
  };

  await writeFile(
    join(projectDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  return metadata;
}

/**
 * List all projects
 * Recalculates texture counts from actual files for accuracy
 */
export async function listProjects(): Promise<ProjectMetadata[]> {
  await ensureDataDir();

  const entries = await readdir(DATA_ROOT, { withFileTypes: true });
  const projects: ProjectMetadata[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== '.gitkeep') {
      const metadataPath = join(DATA_ROOT, entry.name, 'metadata.json');
      if (existsSync(metadataPath)) {
        const data = await readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(data) as ProjectMetadata;

        // Recalculate texture counts from actual files
        const textures = await listTextures(metadata.id);
        metadata.textureCount = textures.length;
        metadata.transformedCount = textures.filter((t) => t.transformedBase64).length;

        projects.push(metadata);
      }
    }
  }

  return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Get project metadata
 * Always recalculates texture counts from actual files for accuracy
 */
export async function getProject(projectId: string): Promise<ProjectMetadata | null> {
  const metadataPath = join(getProjectDir(projectId), 'metadata.json');

  if (!existsSync(metadataPath)) {
    return null;
  }

  const data = await readFile(metadataPath, 'utf-8');
  const metadata = JSON.parse(data) as ProjectMetadata;

  // Recalculate texture counts from actual files
  const textures = await listTextures(projectId);
  metadata.textureCount = textures.length;
  metadata.transformedCount = textures.filter((t) => t.transformedBase64).length;

  return metadata;
}

/**
 * Update project metadata
 */
export async function updateProject(
  projectId: string,
  updates: Partial<ProjectMetadata>
): Promise<ProjectMetadata> {
  const metadata = await getProject(projectId);
  if (!metadata) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const updated = {
    ...metadata,
    ...updates,
    id: metadata.id, // Preserve ID
    updatedAt: new Date().toISOString(),
  };

  await writeFile(
    join(getProjectDir(projectId), 'metadata.json'),
    JSON.stringify(updated, null, 2)
  );

  return updated;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const projectDir = getProjectDir(projectId);

  if (!existsSync(projectDir)) {
    throw new Error(`Project not found: ${projectId}`);
  }

  await rm(projectDir, { recursive: true, force: true });
}

/**
 * Save texture metadata
 */
export async function saveTextureMetadata(
  projectId: string,
  textureName: string,
  metadata: TextureMetadata
): Promise<void> {
  const texturesDir = join(getProjectDir(projectId), 'textures');
  const metadataPath = join(texturesDir, `${textureName}.json`);

  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Get texture metadata
 */
export async function getTextureMetadata(
  projectId: string,
  textureName: string
): Promise<TextureMetadata | null> {
  const metadataPath = join(getProjectDir(projectId), 'textures', `${textureName}.json`);

  if (!existsSync(metadataPath)) {
    return null;
  }

  const data = await readFile(metadataPath, 'utf-8');
  return JSON.parse(data);
}

/**
 * List all textures in a project
 */
export async function listTextures(projectId: string): Promise<TextureMetadata[]> {
  const texturesDir = join(getProjectDir(projectId), 'textures');

  if (!existsSync(texturesDir)) {
    return [];
  }

  const files = await readdir(texturesDir);
  const textures: TextureMetadata[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const data = await readFile(join(texturesDir, file), 'utf-8');
      textures.push(JSON.parse(data));
    }
  }

  return textures;
}

/**
 * Save original texture image
 */
export async function saveOriginalTexture(
  projectId: string,
  textureName: string,
  base64Image: string
): Promise<void> {
  const originalsDir = join(getProjectDir(projectId), 'originals');
  const imagePath = join(originalsDir, `${textureName}.png`);

  // Extract base64 data (remove data:image/png;base64, prefix if present)
  const base64Data = base64Image.replace(/^data:image\/png;base64,/, '');
  await writeFile(imagePath, Buffer.from(base64Data, 'base64'));
}

/**
 * Save transformed texture image
 */
export async function saveTransformedTexture(
  projectId: string,
  textureName: string,
  base64Image: string
): Promise<void> {
  const transformedDir = join(getProjectDir(projectId), 'transformed');
  const imagePath = join(transformedDir, `${textureName}.png`);

  const base64Data = base64Image.replace(/^data:image\/png;base64,/, '');
  await writeFile(imagePath, Buffer.from(base64Data, 'base64'));
}
