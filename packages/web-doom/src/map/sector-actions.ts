/**
 * Sector actions - doors, lifts, etc.
 */

import type { MapData, Sector } from './types';

export enum SectorActionType {
  None,
  DoorOpen,
  DoorClose,
  DoorRaise,
  FloorLower,
  FloorRaise,
  CeilingLower,
  CeilingRaise,
}

export enum SectorActionState {
  Idle,
  Moving,
  Waiting,
}

export interface SectorAction {
  sectorIndex: number;
  type: SectorActionType;
  state: SectorActionState;
  speed: number;
  targetHeight: number;
  originalHeight: number;
  waitTime: number;
  currentTime: number;
}

/**
 * Active sector actions
 */
export class SectorActionManager {
  private actions: Map<number, SectorAction> = new Map();

  /**
   * Add a sector action
   */
  addAction(action: SectorAction): void {
    this.actions.set(action.sectorIndex, action);
  }

  /**
   * Remove a sector action
   */
  removeAction(sectorIndex: number): void {
    this.actions.delete(sectorIndex);
  }

  /**
   * Get action for sector
   */
  getAction(sectorIndex: number): SectorAction | undefined {
    return this.actions.get(sectorIndex);
  }

  /**
   * Check if sector has action
   */
  hasAction(sectorIndex: number): boolean {
    return this.actions.has(sectorIndex);
  }

  /**
   * Update all sector actions
   */
  update(mapData: MapData, deltaTime: number): void {
    for (const [sectorIndex, action] of this.actions.entries()) {
      const sector = mapData.sectors[sectorIndex];
      if (!sector) continue;

      switch (action.state) {
        case SectorActionState.Moving:
          this.updateMoving(sector, action, deltaTime);
          break;
        case SectorActionState.Waiting:
          this.updateWaiting(action, deltaTime);
          break;
      }
    }
  }

  /**
   * Update moving state
   */
  private updateMoving(sector: Sector, action: SectorAction, deltaTime: number): void {
    const distance = action.speed * deltaTime;

    switch (action.type) {
      case SectorActionType.DoorOpen:
      case SectorActionType.DoorRaise:
        // Move ceiling up
        if (sector.ceilingHeight < action.targetHeight) {
          sector.ceilingHeight = Math.min(sector.ceilingHeight + distance, action.targetHeight);
          if (sector.ceilingHeight >= action.targetHeight) {
            action.state = SectorActionState.Waiting;
            action.currentTime = 0;
          }
        }
        break;

      case SectorActionType.DoorClose:
        // Move ceiling down
        if (sector.ceilingHeight > action.targetHeight) {
          sector.ceilingHeight = Math.max(sector.ceilingHeight - distance, action.targetHeight);
          if (sector.ceilingHeight <= action.targetHeight) {
            action.state = SectorActionState.Idle;
            this.removeAction(action.sectorIndex);
          }
        }
        break;

      case SectorActionType.FloorRaise:
        if (sector.floorHeight < action.targetHeight) {
          sector.floorHeight = Math.min(sector.floorHeight + distance, action.targetHeight);
          if (sector.floorHeight >= action.targetHeight) {
            action.state = SectorActionState.Idle;
            this.removeAction(action.sectorIndex);
          }
        }
        break;

      case SectorActionType.FloorLower:
        if (sector.floorHeight > action.targetHeight) {
          sector.floorHeight = Math.max(sector.floorHeight - distance, action.targetHeight);
          if (sector.floorHeight <= action.targetHeight) {
            action.state = SectorActionState.Idle;
            this.removeAction(action.sectorIndex);
          }
        }
        break;
    }
  }

  /**
   * Update waiting state
   */
  private updateWaiting(action: SectorAction, deltaTime: number): void {
    action.currentTime += deltaTime;

    if (action.currentTime >= action.waitTime) {
      // Start closing
      if (action.type === SectorActionType.DoorOpen || action.type === SectorActionType.DoorRaise) {
        action.type = SectorActionType.DoorClose;
        action.targetHeight = action.originalHeight;
        action.state = SectorActionState.Moving;
      }
    }
  }

  /**
   * Clear all actions
   */
  clear(): void {
    this.actions.clear();
  }
}

/**
 * Linedef special types
 */
export enum LinedefSpecial {
  None = 0,
  DoorOpenWaitClose = 1,
  DoorOpen = 2,
  DoorCloseWaitOpen = 3,
  DoorClose = 4,
  FloorRaiseToLowestCeiling = 5,
  CeilingCrushAndRaise = 6,
  StairsBuildUp8 = 7,
  StairsBuildUp16 = 8,
  DonutRaise = 9,
  // Many more... simplified for now
}

/**
 * Activate a linedef
 */
export function activateLinedef(
  mapData: MapData,
  linedefIndex: number,
  actionManager: SectorActionManager
): boolean {
  const linedef = mapData.linedefs[linedefIndex];
  if (!linedef || linedef.specialType === 0) return false;

  // Find sectors with matching tag
  const affectedSectors: number[] = [];
  for (let i = 0; i < mapData.sectors.length; i++) {
    if (mapData.sectors[i].tag === linedef.sectorTag) {
      affectedSectors.push(i);
    }
  }

  if (affectedSectors.length === 0) return false;

  // Handle different special types
  switch (linedef.specialType) {
    case LinedefSpecial.DoorOpenWaitClose:
    case 31: // Manual door open
    case 32: // Manual door open blue
    case 33: // Manual door open red
    case 34: // Manual door open yellow
      return activateDoor(mapData, affectedSectors, actionManager);

    case LinedefSpecial.DoorOpen:
    case 103: // Door open stay
    case 111: // Door blazing open
      return activateDoorOpen(mapData, affectedSectors, actionManager);

    case LinedefSpecial.FloorRaiseToLowestCeiling:
      return activateFloorRaise(mapData, affectedSectors, actionManager);
  }

  return false;
}

/**
 * Activate a door (open, wait, close)
 */
function activateDoor(
  mapData: MapData,
  sectorIndices: number[],
  actionManager: SectorActionManager
): boolean {
  let activated = false;

  for (const sectorIndex of sectorIndices) {
    // Skip if already active
    if (actionManager.hasAction(sectorIndex)) continue;

    const sector = mapData.sectors[sectorIndex];

    // Find the lowest adjacent ceiling height
    let lowestCeiling = Infinity;
    for (const linedef of mapData.linedefs) {
      const rightSidedef = linedef.rightSidedef >= 0 ? mapData.sidedefs[linedef.rightSidedef] : null;
      const leftSidedef = linedef.leftSidedef >= 0 ? mapData.sidedefs[linedef.leftSidedef] : null;

      if (rightSidedef?.sector === sectorIndex && leftSidedef) {
        const adjacentSector = mapData.sectors[leftSidedef.sector];
        lowestCeiling = Math.min(lowestCeiling, adjacentSector.ceilingHeight);
      } else if (leftSidedef?.sector === sectorIndex && rightSidedef) {
        const adjacentSector = mapData.sectors[rightSidedef.sector];
        lowestCeiling = Math.min(lowestCeiling, adjacentSector.ceilingHeight);
      }
    }

    if (lowestCeiling === Infinity) {
      lowestCeiling = sector.ceilingHeight + 128; // Default door height
    }

    const targetHeight = lowestCeiling - 4; // Leave 4 units gap

    actionManager.addAction({
      sectorIndex,
      type: SectorActionType.DoorOpen,
      state: SectorActionState.Moving,
      speed: 64, // Units per second
      targetHeight,
      originalHeight: sector.ceilingHeight,
      waitTime: 4.0, // Wait 4 seconds before closing
      currentTime: 0,
    });

    activated = true;
  }

  return activated;
}

/**
 * Activate a door (open and stay)
 */
function activateDoorOpen(
  mapData: MapData,
  sectorIndices: number[],
  actionManager: SectorActionManager
): boolean {
  let activated = false;

  for (const sectorIndex of sectorIndices) {
    if (actionManager.hasAction(sectorIndex)) continue;

    const sector = mapData.sectors[sectorIndex];

    let lowestCeiling = sector.ceilingHeight + 128;
    for (const linedef of mapData.linedefs) {
      const rightSidedef = linedef.rightSidedef >= 0 ? mapData.sidedefs[linedef.rightSidedef] : null;
      const leftSidedef = linedef.leftSidedef >= 0 ? mapData.sidedefs[linedef.leftSidedef] : null;

      if (rightSidedef?.sector === sectorIndex && leftSidedef) {
        const adjacentSector = mapData.sectors[leftSidedef.sector];
        lowestCeiling = Math.min(lowestCeiling, adjacentSector.ceilingHeight);
      } else if (leftSidedef?.sector === sectorIndex && rightSidedef) {
        const adjacentSector = mapData.sectors[rightSidedef.sector];
        lowestCeiling = Math.min(lowestCeiling, adjacentSector.ceilingHeight);
      }
    }

    const targetHeight = lowestCeiling - 4;

    actionManager.addAction({
      sectorIndex,
      type: SectorActionType.DoorRaise,
      state: SectorActionState.Moving,
      speed: 64,
      targetHeight,
      originalHeight: sector.ceilingHeight,
      waitTime: 0, // Don't close
      currentTime: 0,
    });

    activated = true;
  }

  return activated;
}

/**
 * Activate floor raise
 */
function activateFloorRaise(
  mapData: MapData,
  sectorIndices: number[],
  actionManager: SectorActionManager
): boolean {
  let activated = false;

  for (const sectorIndex of sectorIndices) {
    if (actionManager.hasAction(sectorIndex)) continue;

    const sector = mapData.sectors[sectorIndex];
    const targetHeight = sector.ceilingHeight;

    actionManager.addAction({
      sectorIndex,
      type: SectorActionType.FloorRaise,
      state: SectorActionState.Moving,
      speed: 32,
      targetHeight,
      originalHeight: sector.floorHeight,
      waitTime: 0,
      currentTime: 0,
    });

    activated = true;
  }

  return activated;
}
