import {
  ControllerSchema,
  ButtonSchema,
  DPadSchema,
  StickSchema,
} from '../types';

/**
 * Generate SVG markup for controller from schema
 */
export function generateControllerSVG(schema: ControllerSchema): string {
  const { width, height, buttons, background } = schema;
  const bgColor = background?.color || '#1a1a1a';
  const bgOpacity = background?.opacity || 0.8;

  const buttonElements = buttons.map(generateButtonSVG).join('\n');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <style>
          .button { fill: var(--button-color); stroke: rgba(255,255,255,0.3); stroke-width: 2; }
          .button-label { fill: white; font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; user-select: none; }
          .button-label-small { fill: white; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; user-select: none; }
          .dpad-part { fill: #4a4a4a; stroke: rgba(255,255,255,0.3); stroke-width: 2; }
          .shoulder { fill: #5a5a5a; stroke: rgba(255,255,255,0.3); stroke-width: 2; rx: 8; }
        </style>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${bgColor}" opacity="${bgOpacity}" rx="20"/>

      <!-- Buttons -->
      ${buttonElements}
    </svg>
  `.trim();
}

/**
 * Generate SVG for a single button
 */
function generateButtonSVG(button: ButtonSchema | DPadSchema | StickSchema): string {
  if (button.type === 'dpad') {
    return generateDPadSVG(button as DPadSchema);
  }

  const { visual, label, id } = button;
  const { type, position, size, color, icon } = visual;
  const buttonColor = color || '#4a4a4a';

  if (type === 'circle') {
    return `
      <g id="${id}">
        <circle class="button" cx="${position.x}" cy="${position.y}" r="${size / 2}" style="--button-color: ${buttonColor}"/>
        <text class="button-label" x="${position.x}" y="${position.y}">${icon || label}</text>
      </g>
    `;
  }

  if (type === 'rect' || button.type === 'shoulder') {
    const rectX = position.x - size / 2;
    const rectY = position.y - size / 2;
    const rectHeight = button.type === 'shoulder' ? size * 0.5 : size * 0.6;
    const className = button.type === 'shoulder' ? 'shoulder' : 'button';

    // Use smaller font for longer text (like SELECT, START)
    const text = icon || label;
    const labelClass = text.length > 3 ? 'button-label-small' : 'button-label';

    return `
      <g id="${id}">
        <rect class="${className}" x="${rectX}" y="${rectY}" width="${size}" height="${rectHeight}" style="--button-color: ${buttonColor}"/>
        <text class="${labelClass}" x="${position.x}" y="${position.y}">${text}</text>
      </g>
    `;
  }

  return '';
}

/**
 * Generate SVG for D-pad
 */
function generateDPadSVG(dpad: DPadSchema): string {
  const { visual, id } = dpad;
  const { position, size } = visual;
  const centerX = position.x;
  const centerY = position.y;
  const armWidth = size / 3;
  const armLength = size / 2;

  // D-pad is a plus shape
  return `
    <g id="${id}">
      <!-- Vertical bar -->
      <rect class="dpad-part"
        x="${centerX - armWidth / 2}"
        y="${centerY - armLength}"
        width="${armWidth}"
        height="${armLength * 2}"
        rx="4"/>

      <!-- Horizontal bar -->
      <rect class="dpad-part"
        x="${centerX - armLength}"
        y="${centerY - armWidth / 2}"
        width="${armLength * 2}"
        height="${armWidth}"
        rx="4"/>

      <!-- Direction labels -->
      <text class="button-label" x="${centerX}" y="${centerY - armLength / 2}" font-size="16">▲</text>
      <text class="button-label" x="${centerX}" y="${centerY + armLength / 2}" font-size="16">▼</text>
      <text class="button-label" x="${centerX - armLength / 2}" y="${centerY}" font-size="16">◀</text>
      <text class="button-label" x="${centerX + armLength / 2}" y="${centerY}" font-size="16">▶</text>
    </g>
  `;
}

/**
 * Convert SVG string to data URL
 */
export function svgToDataURL(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:image/svg+xml,${encoded}`;
}

/**
 * Generate controller image data URL from schema
 */
export function generateControllerImage(schema: ControllerSchema): string {
  const svg = generateControllerSVG(schema);
  return svgToDataURL(svg);
}
