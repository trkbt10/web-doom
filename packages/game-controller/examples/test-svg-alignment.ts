#!/usr/bin/env bun
/**
 * Test SVG text alignment for rect buttons
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { doomControllerSchema } from '../src/index';
import { generateControllerSVG } from '../src/utils/svg-generator';

console.log('🧪 Testing SVG Text Alignment');
console.log('==============================\n');

// Generate SVG
const svg = generateControllerSVG(doomControllerSchema);

// Save to file
const outputPath = join(process.cwd(), 'examples', 'output', 'test-alignment.svg');
writeFileSync(outputPath, svg);

console.log('✅ SVG generated successfully!');
console.log(`📄 Saved to: ${outputPath}`);
console.log('\nCheck the following elements:');
console.log('  • L/R buttons: text should be vertically centered');
console.log('  • SELECT/START: text should be vertically centered');
console.log('\nOpen the SVG file in a browser to verify the alignment.');
