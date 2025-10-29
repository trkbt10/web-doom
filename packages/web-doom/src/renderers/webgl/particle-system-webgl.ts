/**
 * Particle System for WebGL
 * Handles visual effects like blood, smoke, explosions
 */

import * as THREE from 'three';

/**
 * Particle type
 */
export enum ParticleType {
  BLOOD = 'blood',
  SMOKE = 'smoke',
  FIRE = 'fire',
  SPARK = 'spark',
  EXPLOSION = 'explosion'
}

/**
 * Single particle instance
 */
interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  type: ParticleType;
}

/**
 * Manages particle effects in WebGL
 */
export class ParticleSystemWebGL {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private particleSystem: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private maxParticles: number = 10000;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Create particle geometry
    this.geometry = new THREE.BufferGeometry();

    // Create particle material
    this.material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    // Create particle system
    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particleSystem);

    // Initialize buffers
    this.updateGeometry();
  }

  /**
   * Emit blood particles
   */
  emitBlood(position: THREE.Vector3, direction: THREE.Vector3, count: number = 20): void {
    for (let i = 0; i < count; i++) {
      const spread = 0.5;
      const velocity = new THREE.Vector3(
        direction.x + (Math.random() - 0.5) * spread,
        direction.y + Math.random() * 0.5,
        direction.z + (Math.random() - 0.5) * spread
      );

      this.particles.push({
        position: position.clone(),
        velocity: velocity.multiplyScalar(Math.random() * 2 + 1),
        color: new THREE.Color(0.8, 0, 0), // Red
        size: Math.random() * 3 + 1,
        life: 1.0,
        maxLife: Math.random() * 0.5 + 0.5,
        type: ParticleType.BLOOD
      });
    }

    this.limitParticles();
  }

  /**
   * Emit smoke particles
   */
  emitSmoke(position: THREE.Vector3, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const spread = 0.3;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        Math.random() * 1.5 + 0.5, // Rise up
        (Math.random() - 0.5) * spread
      );

      this.particles.push({
        position: position.clone(),
        velocity,
        color: new THREE.Color(0.3, 0.3, 0.3), // Gray
        size: Math.random() * 5 + 3,
        life: 1.0,
        maxLife: Math.random() * 1.0 + 1.0,
        type: ParticleType.SMOKE
      });
    }

    this.limitParticles();
  }

  /**
   * Emit fire particles
   */
  emitFire(position: THREE.Vector3, count: number = 15): void {
    for (let i = 0; i < count; i++) {
      const spread = 0.2;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        Math.random() * 2.0 + 1.0,
        (Math.random() - 0.5) * spread
      );

      // Color varies from yellow to red
      const colorMix = Math.random();
      const color = new THREE.Color(
        1.0,
        colorMix * 0.5 + 0.3,
        colorMix * 0.2
      );

      this.particles.push({
        position: position.clone(),
        velocity,
        color,
        size: Math.random() * 4 + 2,
        life: 1.0,
        maxLife: Math.random() * 0.3 + 0.3,
        type: ParticleType.FIRE
      });
    }

    this.limitParticles();
  }

  /**
   * Emit spark particles
   */
  emitSparks(position: THREE.Vector3, direction: THREE.Vector3, count: number = 30): void {
    for (let i = 0; i < count; i++) {
      const spread = 1.0;
      const velocity = new THREE.Vector3(
        direction.x + (Math.random() - 0.5) * spread,
        Math.random() * 2.0,
        direction.z + (Math.random() - 0.5) * spread
      );

      this.particles.push({
        position: position.clone(),
        velocity: velocity.multiplyScalar(Math.random() * 3 + 2),
        color: new THREE.Color(1.0, 0.8, 0.2), // Yellow-orange
        size: Math.random() * 2 + 1,
        life: 1.0,
        maxLife: Math.random() * 0.2 + 0.2,
        type: ParticleType.SPARK
      });
    }

    this.limitParticles();
  }

  /**
   * Emit explosion particles
   */
  emitExplosion(position: THREE.Vector3, radius: number = 5): void {
    const count = 50;

    for (let i = 0; i < count; i++) {
      // Random direction in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = Math.random() * 5 + 3;

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );

      // Color varies from yellow to red to black
      const colorMix = Math.random();
      const color = new THREE.Color(
        1.0,
        colorMix * 0.5,
        0
      );

      this.particles.push({
        position: position.clone(),
        velocity,
        color,
        size: Math.random() * 6 + 3,
        life: 1.0,
        maxLife: Math.random() * 0.5 + 0.5,
        type: ParticleType.EXPLOSION
      });
    }

    this.limitParticles();
  }

  /**
   * Limit number of particles
   */
  private limitParticles(): void {
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  /**
   * Update particles
   */
  update(deltaTime: number): void {
    const gravity = new THREE.Vector3(0, -9.8, 0);

    // Update each particle
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update life
      particle.life -= deltaTime / particle.maxLife;

      if (particle.life <= 0) {
        // Remove dead particle
        this.particles.splice(i, 1);
        continue;
      }

      // Apply gravity for blood and debris
      if (particle.type === ParticleType.BLOOD || particle.type === ParticleType.SPARK) {
        particle.velocity.add(gravity.clone().multiplyScalar(deltaTime));
      }

      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

      // Apply friction
      particle.velocity.multiplyScalar(0.98);

      // Fade out
      if (particle.type === ParticleType.SMOKE) {
        // Smoke grows and fades
        particle.size += deltaTime * 2;
      }
    }

    // Update geometry
    this.updateGeometry();
  }

  /**
   * Update particle geometry
   */
  private updateGeometry(): void {
    const positions = new Float32Array(this.particles.length * 3);
    const colors = new Float32Array(this.particles.length * 3);
    const sizes = new Float32Array(this.particles.length);

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;

      // Apply life-based alpha to color
      const alpha = particle.life;
      colors[i * 3] = particle.color.r * alpha;
      colors[i * 3 + 1] = particle.color.g * alpha;
      colors[i * 3 + 2] = particle.color.b * alpha;

      sizes[i] = particle.size * particle.life;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Update material size (average size)
    if (this.particles.length > 0) {
      const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      this.material.size = avgSize;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
    this.updateGeometry();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.scene.remove(this.particleSystem);
    this.geometry.dispose();
    this.material.dispose();
    this.particles = [];
  }
}
