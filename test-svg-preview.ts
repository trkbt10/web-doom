import { doomControllerSchema, doomControllerSchemaPortrait } from './packages/game-controller/src/schemas/doom-controller';
import { generateControllerSVG } from './packages/game-controller/src/utils/svg-generator';
import { writeFileSync } from 'fs';

console.log('Generating SVG previews...\n');

// Generate landscape SVG
const landscapeSVG = generateControllerSVG(doomControllerSchema);
writeFileSync('/Users/terukichi/Workspaces/trkbt10/web-doom/preview-landscape.svg', landscapeSVG);
console.log('✅ Landscape SVG saved to: preview-landscape.svg');
console.log(`   Dimensions: ${doomControllerSchema.width}x${doomControllerSchema.height}`);

// Generate portrait SVG
const portraitSVG = generateControllerSVG(doomControllerSchemaPortrait);
writeFileSync('/Users/terukichi/Workspaces/trkbt10/web-doom/preview-portrait.svg', portraitSVG);
console.log('✅ Portrait SVG saved to: preview-portrait.svg');
console.log(`   Dimensions: ${doomControllerSchemaPortrait.width}x${doomControllerSchemaPortrait.height}`);

console.log('\n📝 Preview these files in your browser or image viewer to see the guide lines.');
