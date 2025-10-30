/**
 * Batch Processor
 *
 * Efficient batch processing for texture transformations
 */

import type {
  ExtractedTexture,
  TransformationResult,
  TransformOptions,
  BatchTransformOptions,
  TextureGroup,
  GroupTransformConfig,
} from '../core/types';
import { TransformerPipeline, type TransformerPipelineConfig } from './transformer-pipeline';

/**
 * Batch processing configuration
 */
export interface BatchProcessConfig {
  /** Transformer pipeline configuration */
  pipeline?: TransformerPipelineConfig;
  /** Default concurrency level */
  defaultConcurrency?: number;
  /** Default delay between requests (ms) */
  defaultDelayMs?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Processing statistics
 */
export interface ProcessingStats {
  /** Total textures processed */
  total: number;
  /** Successfully transformed */
  success: number;
  /** Failed transformations */
  failed: number;
  /** Processing time (ms) */
  processingTime: number;
  /** Average time per texture (ms) */
  avgTimePerTexture: number;
}

/**
 * Batch processor for texture transformations
 */
export class BatchProcessor {
  private pipeline: TransformerPipeline;
  private config: Required<BatchProcessConfig>;

  constructor(config: BatchProcessConfig = {}) {
    this.config = {
      pipeline: config.pipeline || {},
      defaultConcurrency: config.defaultConcurrency || 3,
      defaultDelayMs: config.defaultDelayMs || 1000,
      verbose: config.verbose ?? true,
    };

    this.pipeline = new TransformerPipeline(this.config.pipeline);
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[BatchProcessor] ${message}`);
    }
  }

  /**
   * Process a single group with progress tracking
   */
  async processGroup(
    group: TextureGroup,
    options: TransformOptions = {}
  ): Promise<{ results: TransformationResult[]; stats: ProcessingStats }> {
    const startTime = Date.now();

    this.log(`Processing group: ${group.name}`);
    this.log(`  Textures: ${group.textures.length}`);
    this.log(`  Category: ${group.category}`);

    const batchOptions: BatchTransformOptions = {
      ...options,
      concurrency: this.config.defaultConcurrency,
      onProgress: (completed: number, total: number) => {
        this.log(`  Progress: ${completed}/${total} (${Math.round((completed / total) * 100)}%)`);
      },
    };

    const results = await this.pipeline.transformGroup(group, batchOptions);

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    const stats: ProcessingStats = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      processingTime,
      avgTimePerTexture: processingTime / results.length,
    };

    this.log(`Completed group: ${group.name}`);
    this.log(`  Success: ${stats.success}/${stats.total}`);
    this.log(`  Failed: ${stats.failed}`);
    this.log(`  Time: ${(processingTime / 1000).toFixed(2)}s`);

    return { results, stats };
  }

  /**
   * Process multiple groups
   */
  async processGroups(
    groups: TextureGroup[],
    options: TransformOptions = {}
  ): Promise<{
    results: Map<string, TransformationResult[]>;
    stats: Map<string, ProcessingStats>;
    totalStats: ProcessingStats;
  }> {
    const startTime = Date.now();
    const results = new Map<string, TransformationResult[]>();
    const stats = new Map<string, ProcessingStats>();

    this.log(`Processing ${groups.length} groups`);

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      this.log(`\n[${i + 1}/${groups.length}] Starting group: ${group.name}`);

      const { results: groupResults, stats: groupStats } = await this.processGroup(group, options);

      results.set(group.name, groupResults);
      stats.set(group.name, groupStats);
    }

    const endTime = Date.now();

    // Calculate total stats
    const allStats = Array.from(stats.values());
    const totalStats: ProcessingStats = {
      total: allStats.reduce((sum, s) => sum + s.total, 0),
      success: allStats.reduce((sum, s) => sum + s.success, 0),
      failed: allStats.reduce((sum, s) => sum + s.failed, 0),
      processingTime: endTime - startTime,
      avgTimePerTexture: allStats.reduce((sum, s) => sum + s.avgTimePerTexture, 0) / allStats.length,
    };

    this.log(`\n=== Processing Complete ===`);
    this.log(`Total textures: ${totalStats.total}`);
    this.log(`Success: ${totalStats.success}`);
    this.log(`Failed: ${totalStats.failed}`);
    this.log(`Total time: ${(totalStats.processingTime / 1000).toFixed(2)}s`);
    this.log(`Avg time per texture: ${(totalStats.avgTimePerTexture / 1000).toFixed(2)}s`);

    return { results, stats, totalStats };
  }

  /**
   * Process groups with custom configurations for each
   */
  async processGroupsWithConfig(
    configs: GroupTransformConfig[]
  ): Promise<{
    results: Map<string, TransformationResult[]>;
    stats: Map<string, ProcessingStats>;
    totalStats: ProcessingStats;
  }> {
    const startTime = Date.now();
    const results = new Map<string, TransformationResult[]>();
    const stats = new Map<string, ProcessingStats>();

    this.log(`Processing ${configs.length} groups with custom configs`);

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const { group, options, promptOverride } = config;

      this.log(`\n[${i + 1}/${configs.length}] Starting group: ${group.name}`);
      if (promptOverride) {
        this.log(`  Custom prompt: ${promptOverride}`);
      }

      const groupOptions: BatchTransformOptions = {
        ...options,
        concurrency: this.config.defaultConcurrency,
        customPrompt: promptOverride || options.customPrompt,
      };

      const { results: groupResults, stats: groupStats } = await this.processGroup(group, groupOptions);

      results.set(group.name, groupResults);
      stats.set(group.name, groupStats);
    }

    const endTime = Date.now();

    // Calculate total stats
    const allStats = Array.from(stats.values());
    const totalStats: ProcessingStats = {
      total: allStats.reduce((sum, s) => sum + s.total, 0),
      success: allStats.reduce((sum, s) => sum + s.success, 0),
      failed: allStats.reduce((sum, s) => sum + s.failed, 0),
      processingTime: endTime - startTime,
      avgTimePerTexture: allStats.reduce((sum, s) => sum + s.avgTimePerTexture, 0) / allStats.length,
    };

    this.log(`\n=== Processing Complete ===`);
    this.log(`Total textures: ${totalStats.total}`);
    this.log(`Success: ${totalStats.success}`);
    this.log(`Failed: ${totalStats.failed}`);
    this.log(`Total time: ${(totalStats.processingTime / 1000).toFixed(2)}s`);
    this.log(`Avg time per texture: ${(totalStats.avgTimePerTexture / 1000).toFixed(2)}s`);

    return { results, stats, totalStats };
  }

  /**
   * Save processing results
   */
  async saveResults(
    results: Map<string, TransformationResult[]>,
    outputDir: string
  ): Promise<void> {
    this.log(`Saving results to: ${outputDir}`);
    await this.pipeline.saveGroupedResults(results, outputDir);
    this.log('Save complete');
  }
}

/**
 * Create batch processor instance
 */
export function createBatchProcessor(config?: BatchProcessConfig): BatchProcessor {
  return new BatchProcessor(config);
}
