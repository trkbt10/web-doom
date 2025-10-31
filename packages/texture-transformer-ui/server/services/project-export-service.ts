import { readFile, writeFile, readdir, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import { extract } from 'tar';
import {
  getProject,
  listTextures,
  createProject,
  type ProjectMetadata,
  type TextureMetadata,
} from './project-manager';

const DATA_ROOT = join(process.cwd(), 'data');
const EXPORT_ROOT = join(process.cwd(), 'exports');

/**
 * Ensure exports directory exists
 */
async function ensureExportDir(): Promise<void> {
  if (!existsSync(EXPORT_ROOT)) {
    await mkdir(EXPORT_ROOT, { recursive: true });
  }
}

/**
 * Export project as archive
 */
export async function exportProject(projectId: string): Promise<{
  success: boolean;
  filePath?: string;
  error?: string;
}> {
  try {
    await ensureExportDir();

    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const outputPath = join(EXPORT_ROOT, `${projectId}.tar.gz`);
    const projectDir = join(DATA_ROOT, projectId);

    // Create tar.gz archive
    const output = createWriteStream(outputPath);
    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: { level: 9 },
    });

    archive.pipe(output);

    // Add all project files
    archive.directory(projectDir, false);

    await archive.finalize();

    return {
      success: true,
      filePath: outputPath,
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Import project from archive
 */
export async function importProject(
  archivePath: string,
  newName?: string
): Promise<{
  success: boolean;
  project?: ProjectMetadata;
  error?: string;
}> {
  try {
    // Create temporary directory for extraction
    const tempDir = join(DATA_ROOT, `temp-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      // Extract archive
      await pipeline(
        createReadStream(archivePath),
        extract({ cwd: tempDir })
      );

      // Read project metadata
      const metadataPath = join(tempDir, 'metadata.json');
      if (!existsSync(metadataPath)) {
        throw new Error('Invalid project archive: metadata.json not found');
      }

      const metadataContent = await readFile(metadataPath, 'utf-8');
      const oldMetadata: ProjectMetadata = JSON.parse(metadataContent);

      // Create new project
      const projectName = newName || `${oldMetadata.name} (imported)`;

      // Read the WAD file from the extracted archive
      const wadFilePath = join(tempDir, oldMetadata.wadFile);
      if (!existsSync(wadFilePath)) {
        throw new Error(`WAD file not found in archive: ${oldMetadata.wadFile}`);
      }
      const wadFileBuffer = await readFile(wadFilePath);

      const newProject = await createProject(
        projectName,
        wadFileBuffer,
        oldMetadata.wadFile,
        oldMetadata.description
      );

      // Copy all files to new project directory
      const newProjectDir = join(DATA_ROOT, newProject.id);
      const files = await readdir(tempDir, { recursive: true });

      for (const file of files) {
        const sourcePath = join(tempDir, file);
        const destPath = join(newProjectDir, file);

        // Create directory if needed
        const destDir = join(destPath, '..');
        if (!existsSync(destDir)) {
          await mkdir(destDir, { recursive: true });
        }

        // Copy file
        const content = await readFile(sourcePath);
        await writeFile(destPath, content);
      }

      // Update project metadata
      const updatedMetadata = {
        ...newProject,
        textureCount: oldMetadata.textureCount,
        transformedCount: oldMetadata.transformedCount,
      };

      await writeFile(
        join(newProjectDir, 'metadata.json'),
        JSON.stringify(updatedMetadata, null, 2)
      );

      // Clean up temp directory
      await rm(tempDir, { recursive: true, force: true });

      return {
        success: true,
        project: updatedMetadata,
      };
    } catch (error) {
      // Clean up temp directory on error
      if (existsSync(tempDir)) {
        await rm(tempDir, { recursive: true, force: true });
      }
      throw error;
    }
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export project as JSON (metadata only)
 */
export async function exportProjectJSON(projectId: string): Promise<{
  success: boolean;
  data?: {
    project: ProjectMetadata;
    textures: TextureMetadata[];
  };
  error?: string;
}> {
  try {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const textures = await listTextures(projectId);

    return {
      success: true,
      data: {
        project,
        textures,
      },
    };
  } catch (error) {
    console.error('Export JSON error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
