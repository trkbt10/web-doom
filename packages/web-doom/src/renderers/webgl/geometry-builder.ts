/**
 * Geometry Builder for WebGL Renderer
 * Converts DOOM map data into Three.js geometries
 */

import * as THREE from 'three';
import type { MapData, Linedef, Sector, Sidedef, Vertex } from '../../map/types';

/**
 * Build wall geometry from linedef
 */
export function buildWallGeometry(
  linedef: Linedef,
  vertices: Vertex[],
  sidedef: Sidedef,
  sector: Sector,
  neighborSector: Sector | null
): THREE.BufferGeometry {
  const v1 = vertices[linedef.startVertex];
  const v2 = vertices[linedef.endVertex];

  if (!v1 || !v2) {
    return new THREE.BufferGeometry();
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Calculate wall normal (perpendicular to the wall)
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / length; // Normal X
  const nz = dx / length;  // Normal Z (Y in DOOM coordinates)

  // Determine wall heights
  let bottomHeight = sector.floorHeight;
  let topHeight = sector.ceilingHeight;

  // If there's a neighboring sector, we need to handle upper/lower textures
  if (neighborSector) {
    // Lower wall (if neighbor floor is higher)
    if (neighborSector.floorHeight > sector.floorHeight && sidedef.lowerTexture) {
      buildWallQuad(
        positions, normals, uvs, indices,
        v1.x, sector.floorHeight, v1.y,
        v2.x, sector.floorHeight, v2.y,
        v2.x, neighborSector.floorHeight, v2.y,
        v1.x, neighborSector.floorHeight, v1.y,
        nx, 0, nz,
        length, neighborSector.floorHeight - sector.floorHeight
      );
    }

    // Upper wall (if neighbor ceiling is lower)
    if (neighborSector.ceilingHeight < sector.ceilingHeight && sidedef.upperTexture) {
      buildWallQuad(
        positions, normals, uvs, indices,
        v1.x, neighborSector.ceilingHeight, v1.y,
        v2.x, neighborSector.ceilingHeight, v2.y,
        v2.x, sector.ceilingHeight, v2.y,
        v1.x, sector.ceilingHeight, v1.y,
        nx, 0, nz,
        length, sector.ceilingHeight - neighborSector.ceilingHeight
      );
    }

    // Middle wall (transparent texture between sectors)
    if (sidedef.middleTexture) {
      const midBottom = Math.max(sector.floorHeight, neighborSector.floorHeight);
      const midTop = Math.min(sector.ceilingHeight, neighborSector.ceilingHeight);

      if (midTop > midBottom) {
        buildWallQuad(
          positions, normals, uvs, indices,
          v1.x, midBottom, v1.y,
          v2.x, midBottom, v2.y,
          v2.x, midTop, v2.y,
          v1.x, midTop, v1.y,
          nx, 0, nz,
          length, midTop - midBottom
        );
      }
    }
  } else {
    // Solid wall (no neighbor sector)
    if (sidedef.middleTexture) {
      buildWallQuad(
        positions, normals, uvs, indices,
        v1.x, bottomHeight, v1.y,
        v2.x, bottomHeight, v2.y,
        v2.x, topHeight, v2.y,
        v1.x, topHeight, v1.y,
        nx, 0, nz,
        length, topHeight - bottomHeight
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

/**
 * Build a single wall quad
 */
function buildWallQuad(
  positions: number[],
  normals: number[],
  uvs: number[],
  indices: number[],
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  x3: number, y3: number, z3: number,
  x4: number, y4: number, z4: number,
  nx: number, ny: number, nz: number,
  width: number,
  height: number
): void {
  const vertexOffset = positions.length / 3;

  // Add vertices (in Three.js coordinate system: X-right, Y-up, Z-forward)
  // DOOM uses X-right, Y-forward, Z-up, so we swap Y and Z
  positions.push(x1, y1, z1);
  positions.push(x2, y2, z2);
  positions.push(x3, y3, z3);
  positions.push(x4, y4, z4);

  // Add normals
  for (let i = 0; i < 4; i++) {
    normals.push(nx, ny, nz);
  }

  // Add UVs (texture coordinates)
  // DOOM textures are typically tiled
  const uScale = width / 64; // Assuming 64-unit texture width
  const vScale = height / 64; // Assuming 64-unit texture height

  uvs.push(0, vScale);
  uvs.push(uScale, vScale);
  uvs.push(uScale, 0);
  uvs.push(0, 0);

  // Add indices (two triangles per quad)
  indices.push(
    vertexOffset + 0, vertexOffset + 1, vertexOffset + 2,
    vertexOffset + 0, vertexOffset + 2, vertexOffset + 3
  );
}

/**
 * Build floor/ceiling geometry from sector
 */
export function buildFloorCeilingGeometry(
  sector: Sector,
  vertices: Vertex[],
  linedefs: Linedef[],
  isFloor: boolean
): THREE.BufferGeometry {
  // Get all vertices that belong to this sector
  const sectorVertices: THREE.Vector2[] = [];
  const vertexSet = new Set<number>();

  // Find all linedefs that belong to this sector
  for (const linedef of linedefs) {
    const rightSide = linedef.rightSidedef;
    const leftSide = linedef.leftSidedef;

    const belongsToSector =
      (rightSide !== null && rightSide !== undefined) ||
      (leftSide !== null && leftSide !== undefined);

    if (belongsToSector) {
      if (!vertexSet.has(linedef.startVertex)) {
        const v = vertices[linedef.startVertex];
        if (v) {
          sectorVertices.push(new THREE.Vector2(v.x, v.y));
          vertexSet.add(linedef.startVertex);
        }
      }
      if (!vertexSet.has(linedef.endVertex)) {
        const v = vertices[linedef.endVertex];
        if (v) {
          sectorVertices.push(new THREE.Vector2(v.x, v.y));
          vertexSet.add(linedef.endVertex);
        }
      }
    }
  }

  if (sectorVertices.length < 3) {
    return new THREE.BufferGeometry();
  }

  // Create a shape from the vertices
  const shape = new THREE.Shape(sectorVertices);

  // Generate geometry from shape
  const geometry = new THREE.ShapeGeometry(shape);

  // Adjust height and orientation
  const height = isFloor ? sector.floorHeight : sector.ceilingHeight;
  const positions = geometry.attributes.position.array as Float32Array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 1];

    // Set Y to height, swap Y and Z for DOOM coordinate system
    positions[i] = x;
    positions[i + 1] = height;
    positions[i + 2] = z;
  }

  // Flip ceiling normals
  if (!isFloor) {
    geometry.scale(1, 1, -1);
  }

  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Build complete map geometry
 */
export function buildMapGeometry(mapData: MapData): {
  walls: THREE.Group;
  floors: THREE.Group;
  ceilings: THREE.Group;
} {
  const walls = new THREE.Group();
  const floors = new THREE.Group();
  const ceilings = new THREE.Group();

  // Build wall geometries
  for (const linedef of mapData.linedefs) {
    // Right side
    if (linedef.rightSidedef !== null && linedef.rightSidedef !== undefined) {
      const sidedef = mapData.sidedefs[linedef.rightSidedef];
      const sector = mapData.sectors[sidedef.sector];

      let neighborSector = null;
      if (linedef.leftSidedef !== null && linedef.leftSidedef !== undefined) {
        const leftSidedef = mapData.sidedefs[linedef.leftSidedef];
        neighborSector = mapData.sectors[leftSidedef.sector];
      }

      const geometry = buildWallGeometry(
        linedef,
        mapData.vertices,
        sidedef,
        sector,
        neighborSector
      );

      if (geometry.attributes.position.count > 0) {
        // Material will be assigned later
        const mesh = new THREE.Mesh(geometry);
        mesh.userData = {
          type: 'wall',
          sidedef,
          sector,
          neighborSector
        };
        walls.add(mesh);
      }
    }

    // Left side
    if (linedef.leftSidedef !== null && linedef.leftSidedef !== undefined) {
      const sidedef = mapData.sidedefs[linedef.leftSidedef];
      const sector = mapData.sectors[sidedef.sector];

      let neighborSector = null;
      if (linedef.rightSidedef !== null && linedef.rightSidedef !== undefined) {
        const rightSidedef = mapData.sidedefs[linedef.rightSidedef];
        neighborSector = mapData.sectors[rightSidedef.sector];
      }

      // Reverse the linedef for left side
      const reversedLinedef = {
        ...linedef,
        startVertex: linedef.endVertex,
        endVertex: linedef.startVertex
      };

      const geometry = buildWallGeometry(
        reversedLinedef,
        mapData.vertices,
        sidedef,
        sector,
        neighborSector
      );

      if (geometry.attributes.position.count > 0) {
        const mesh = new THREE.Mesh(geometry);
        mesh.userData = {
          type: 'wall',
          sidedef,
          sector,
          neighborSector
        };
        walls.add(mesh);
      }
    }
  }

  // Build floor and ceiling geometries for each sector
  for (let i = 0; i < mapData.sectors.length; i++) {
    const sector = mapData.sectors[i];

    // Get linedefs for this sector
    const sectorLinedefs = mapData.linedefs.filter(linedef => {
      const rightSide = linedef.rightSidedef;
      const leftSide = linedef.leftSidedef;

      if (rightSide !== null && rightSide !== undefined) {
        const sidedef = mapData.sidedefs[rightSide];
        if (sidedef.sector === i) return true;
      }
      if (leftSide !== null && leftSide !== undefined) {
        const sidedef = mapData.sidedefs[leftSide];
        if (sidedef.sector === i) return true;
      }
      return false;
    });

    // Build floor
    const floorGeometry = buildFloorCeilingGeometry(
      sector,
      mapData.vertices,
      sectorLinedefs,
      true
    );
    if (floorGeometry.attributes.position.count > 0) {
      const floorMesh = new THREE.Mesh(floorGeometry);
      floorMesh.userData = {
        type: 'floor',
        sector,
        sectorIndex: i
      };
      floors.add(floorMesh);
    }

    // Build ceiling
    const ceilingGeometry = buildFloorCeilingGeometry(
      sector,
      mapData.vertices,
      sectorLinedefs,
      false
    );
    if (ceilingGeometry.attributes.position.count > 0) {
      const ceilingMesh = new THREE.Mesh(ceilingGeometry);
      ceilingMesh.userData = {
        type: 'ceiling',
        sector,
        sectorIndex: i
      };
      ceilings.add(ceilingMesh);
    }
  }

  return { walls, floors, ceilings };
}
