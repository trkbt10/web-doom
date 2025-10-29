/**
 * Particle effects system
 */

import type { Vec3 } from '../types';

export enum ParticleType {
  Blood,
  Explosion,
  BulletPuff,
  Spark,
}

export interface Particle {
  id: number;
  type: ParticleType;
  position: Vec3;
  velocity: Vec3;
  life: number; // Remaining life in seconds
  maxLife: number;
  size: number;
  color: string;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId = 1;

  /**
   * Create blood particles
   */
  createBlood(position: Vec3, direction: Vec3, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      // Random spread
      const spread = 0.5;
      const vx = direction.x + (Math.random() - 0.5) * spread;
      const vy = direction.y + (Math.random() - 0.5) * spread;
      const vz = (Math.random() - 0.5) * spread + 1.0;

      this.particles.push({
        id: this.nextId++,
        type: ParticleType.Blood,
        position: { ...position },
        velocity: {
          x: vx * 100,
          y: vy * 100,
          z: vz * 50,
        },
        life: 0.5,
        maxLife: 0.5,
        size: Math.random() * 3 + 2,
        color: '#aa0000',
      });
    }
  }

  /**
   * Create explosion particles
   */
  createExplosion(position: Vec3, radius: number = 50): void {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 200 + 100;

      this.particles.push({
        id: this.nextId++,
        type: ParticleType.Explosion,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
          z: (Math.random() - 0.5) * speed,
        },
        life: 0.3,
        maxLife: 0.3,
        size: Math.random() * 8 + 4,
        color: '#ff6600',
      });
    }

    // Add smoke particles
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50 + 25;

      this.particles.push({
        id: this.nextId++,
        type: ParticleType.Explosion,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
          z: Math.random() * 100,
        },
        life: 0.8,
        maxLife: 0.8,
        size: Math.random() * 12 + 8,
        color: '#444444',
      });
    }
  }

  /**
   * Create bullet puff (wall impact)
   */
  createBulletPuff(position: Vec3): void {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50 + 25;

      this.particles.push({
        id: this.nextId++,
        type: ParticleType.BulletPuff,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
          z: Math.random() * 50,
        },
        life: 0.2,
        maxLife: 0.2,
        size: Math.random() * 4 + 2,
        color: '#cccccc',
      });
    }
  }

  /**
   * Create spark particles
   */
  createSparks(position: Vec3, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 50;

      this.particles.push({
        id: this.nextId++,
        type: ParticleType.Spark,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
          z: Math.random() * 100,
        },
        life: 0.15,
        maxLife: 0.15,
        size: 2,
        color: '#ffff00',
      });
    }
  }

  /**
   * Update all particles
   */
  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;

      // Apply gravity to certain particle types
      if (particle.type === ParticleType.Blood || particle.type === ParticleType.Explosion) {
        particle.velocity.z -= 200 * deltaTime; // Gravity
      }

      // Update life
      particle.life -= deltaTime;

      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Get all particles
   */
  getParticles(): Particle[] {
    return this.particles;
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }

  /**
   * Get particle count
   */
  getCount(): number {
    return this.particles.length;
  }
}

/**
 * Render particles on screen
 */
export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  camera: { position: Vec3; angle: number },
  canvasWidth: number,
  canvasHeight: number
): void {
  for (const particle of particles) {
    // Transform particle to camera space
    const relX = particle.position.x - camera.position.x;
    const relY = particle.position.y - camera.position.y;

    // Rotate to camera view
    const cos = Math.cos(-camera.angle);
    const sin = Math.sin(-camera.angle);
    const camX = relX * cos - relY * sin;
    const camY = relX * sin + relY * cos;

    // Skip if behind camera
    if (camY <= 0.1) continue;

    // Project to screen space
    const screenX = (camX / camY) * (canvasWidth / 2) + canvasWidth / 2;
    const screenY = canvasHeight / 2 - (particle.position.z / camY) * (canvasHeight / 2);

    // Skip if outside screen
    if (screenX < 0 || screenX >= canvasWidth || screenY < 0 || screenY >= canvasHeight) {
      continue;
    }

    // Calculate size based on distance
    const size = (particle.size / camY) * (canvasHeight / 2);

    // Calculate alpha based on remaining life
    const alpha = particle.life / particle.maxLife;

    // Draw particle
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, Math.max(1, size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
