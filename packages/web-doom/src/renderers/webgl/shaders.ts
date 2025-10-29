/**
 * Custom DOOM-style Shaders
 * Provides retro rendering effects similar to the original DOOM
 */

/**
 * Vertex shader for DOOM-style walls
 */
export const doomWallVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDistance;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPosition.xyz;
    vDistance = length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Fragment shader for DOOM-style walls
 */
export const doomWallFragmentShader = `
  uniform sampler2D map;
  uniform float lightLevel;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDistance;

  void main() {
    // Sample texture
    vec4 texColor = texture2D(map, vUv);

    // Apply light level (DOOM-style sector lighting)
    vec3 lit = texColor.rgb * lightLevel;

    // Distance-based fog (depth cueing)
    float fogFactor = smoothstep(fogNear, fogFar, vDistance);
    vec3 finalColor = mix(lit, fogColor, fogFactor);

    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

/**
 * Vertex shader for floor/ceiling with distance-based texture distortion
 */
export const doomFloorVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vDistance;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = mvPosition.xyz;
    vDistance = length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Fragment shader for floor/ceiling
 */
export const doomFloorFragmentShader = `
  uniform sampler2D map;
  uniform float lightLevel;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vDistance;

  void main() {
    // Sample texture with tiling
    vec2 tiledUv = vUv * 0.015625; // 1/64 for 64x64 flats
    vec4 texColor = texture2D(map, tiledUv);

    // Apply light level
    vec3 lit = texColor.rgb * lightLevel;

    // Distance-based fog
    float fogFactor = smoothstep(fogNear, fogFar, vDistance);
    vec3 finalColor = mix(lit, fogColor, fogFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Vertex shader for sky rendering
 */
export const doomSkyVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader for sky rendering
 */
export const doomSkyFragmentShader = `
  uniform vec3 skyColor;
  uniform vec3 horizonColor;

  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    // Simple gradient sky
    float horizon = smoothstep(-1.0, 1.0, normalize(vWorldPosition).y);
    vec3 color = mix(horizonColor, skyColor, horizon);

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Colormap effect shader (for DOOM's palette-based lighting)
 */
export const colormapFragmentShader = `
  uniform sampler2D colormap;
  uniform sampler2D scene;
  uniform float colormapIndex;

  varying vec2 vUv;

  void main() {
    vec4 sceneColor = texture2D(scene, vUv);

    // Simulate DOOM's colormap by darkening based on distance
    // In real DOOM, this would lookup a palette-based colormap
    float darkness = clamp(colormapIndex, 0.0, 1.0);
    vec3 darkenedColor = sceneColor.rgb * (1.0 - darkness * 0.7);

    gl_FragColor = vec4(darkenedColor, sceneColor.a);
  }
`;

/**
 * Post-processing shader for retro pixelation effect
 */
export const pixelationVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const pixelationFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  uniform float pixelSize;

  varying vec2 vUv;

  void main() {
    vec2 dxy = pixelSize / resolution;
    vec2 coord = dxy * floor(vUv / dxy);
    gl_FragColor = texture2D(tDiffuse, coord);
  }
`;

/**
 * Palette quantization shader (simulate 256-color palette)
 */
export const paletteQuantizationFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float colors;

  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);

    // Quantize to limited palette
    float levels = colors;
    vec3 quantized = floor(color.rgb * levels) / levels;

    gl_FragColor = vec4(quantized, color.a);
  }
`;

/**
 * Create a DOOM-style wall shader material
 */
export function createDoomWallMaterial(texture: THREE.Texture, lightLevel: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      lightLevel: { value: lightLevel / 255 },
      fogColor: { value: new THREE.Vector3(0, 0, 0) },
      fogNear: { value: 100 },
      fogFar: { value: 1000 }
    },
    vertexShader: doomWallVertexShader,
    fragmentShader: doomWallFragmentShader,
    side: THREE.DoubleSide,
    transparent: true
  });
}

/**
 * Create a DOOM-style floor/ceiling shader material
 */
export function createDoomFloorMaterial(texture: THREE.Texture, lightLevel: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      lightLevel: { value: lightLevel / 255 },
      fogColor: { value: new THREE.Vector3(0, 0, 0) },
      fogNear: { value: 100 },
      fogFar: { value: 1000 }
    },
    vertexShader: doomFloorVertexShader,
    fragmentShader: doomFloorFragmentShader,
    side: THREE.DoubleSide
  });
}

/**
 * Create a sky shader material
 */
export function createDoomSkyMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      skyColor: { value: new THREE.Vector3(0.2, 0.4, 0.8) },
      horizonColor: { value: new THREE.Vector3(0.6, 0.5, 0.4) }
    },
    vertexShader: doomSkyVertexShader,
    fragmentShader: doomSkyFragmentShader,
    side: THREE.BackSide,
    depthWrite: false
  });
}

// Re-export THREE for convenience
import * as THREE from 'three';
