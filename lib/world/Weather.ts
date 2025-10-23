import * as THREE from 'three';
import { InstancedMeshHelper } from '../util/Instancing';

/**
 * Weather system with rain, snow, and fog effects
 */
export enum WeatherType {
  CLEAR = 'clear',
  RAIN = 'rain',
  SNOW = 'snow',
  HEAVY_RAIN = 'heavy_rain',
}

export class Weather {
  private rainParticles: InstancedMeshHelper | null = null;
  private snowParticles: InstancedMeshHelper | null = null;
  private activeWeather: WeatherType = WeatherType.CLEAR;
  private particlePositions: THREE.Vector3[] = [];
  private particleVelocities: THREE.Vector3[] = [];
  private time = 0;

  private readonly maxParticles = 1000;
  private readonly particleSpawnRadius = 50;

  constructor() {}

  setWeather(type: WeatherType, cameraPosition: THREE.Vector3): THREE.Group {
    this.activeWeather = type;

    // Clear existing particles
    if (this.rainParticles) {
      this.rainParticles.reset();
    }
    if (this.snowParticles) {
      this.snowParticles.reset();
    }

    const group = new THREE.Group();

    if (type === WeatherType.RAIN || type === WeatherType.HEAVY_RAIN) {
      this.createRain(group, type === WeatherType.HEAVY_RAIN ? 1.5 : 1.0);
    } else if (type === WeatherType.SNOW) {
      this.createSnow(group);
    }

    return group;
  }

  private createRain(group: THREE.Group, intensity: number): void {
    const particleCount = Math.floor(this.maxParticles * intensity);

    // Create rain particle geometry (thin lines)
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0x88aacc,
      transparent: true,
      opacity: 0.4,
    });

    this.rainParticles = new InstancedMeshHelper(geometry, material, particleCount);
    group.add(this.rainParticles.getMesh());

    // Initialize particle positions and velocities
    this.particlePositions = [];
    this.particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * this.particleSpawnRadius * 2;
      const y = Math.random() * 40 + 10;
      const z = (Math.random() - 0.5) * this.particleSpawnRadius * 2;

      this.particlePositions.push(new THREE.Vector3(x, y, z));
      this.particleVelocities.push(new THREE.Vector3(0, -20 - Math.random() * 5, 0));
    }

    // Add instances
    for (let i = 0; i < particleCount; i++) {
      this.rainParticles.addInstance(
        this.particlePositions[i],
        new THREE.Euler(0, 0, 0),
        new THREE.Vector3(1, 1, 1)
      );
    }

    this.rainParticles.finalize();
  }

  private createSnow(group: THREE.Group): void {
    const particleCount = Math.floor(this.maxParticles * 0.6);

    // Create snowflake geometry (small spheres)
    const geometry = new THREE.SphereGeometry(0.1, 6, 6);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });

    this.snowParticles = new InstancedMeshHelper(geometry, material, particleCount);
    group.add(this.snowParticles.getMesh());

    // Initialize particle positions and velocities
    this.particlePositions = [];
    this.particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * this.particleSpawnRadius * 2;
      const y = Math.random() * 40 + 10;
      const z = (Math.random() - 0.5) * this.particleSpawnRadius * 2;

      this.particlePositions.push(new THREE.Vector3(x, y, z));

      // Snow falls slower with some drift
      const driftX = (Math.random() - 0.5) * 2;
      const driftZ = (Math.random() - 0.5) * 2;
      this.particleVelocities.push(new THREE.Vector3(driftX, -2 - Math.random(), driftZ));
    }

    // Add instances
    for (let i = 0; i < particleCount; i++) {
      this.snowParticles.addInstance(
        this.particlePositions[i],
        new THREE.Euler(0, 0, 0),
        new THREE.Vector3(1, 1, 1)
      );
    }

    this.snowParticles.finalize();
  }

  update(dt: number, cameraPosition: THREE.Vector3): void {
    this.time += dt;

    if (this.activeWeather === WeatherType.CLEAR) return;

    const particles =
      this.activeWeather === WeatherType.SNOW ? this.snowParticles : this.rainParticles;
    if (!particles) return;

    // Update particle positions
    for (let i = 0; i < this.particlePositions.length; i++) {
      const pos = this.particlePositions[i];
      const vel = this.particleVelocities[i];

      // Update position
      pos.add(vel.clone().multiplyScalar(dt));

      // Snow has wind drift
      if (this.activeWeather === WeatherType.SNOW) {
        pos.x += Math.sin(this.time + i) * 0.5 * dt;
      }

      // Respawn particle if it goes below ground or too far from camera
      if (pos.y < 0 || pos.distanceTo(cameraPosition) > this.particleSpawnRadius) {
        pos.x = cameraPosition.x + (Math.random() - 0.5) * this.particleSpawnRadius * 2;
        pos.y = 40 + Math.random() * 10;
        pos.z = cameraPosition.z + (Math.random() - 0.5) * this.particleSpawnRadius * 2;
      }

      // Update instance
      particles.updateInstance(
        i,
        pos,
        new THREE.Euler(0, 0, 0),
        new THREE.Vector3(1, 1, 1)
      );
    }
  }

  getActiveWeather(): WeatherType {
    return this.activeWeather;
  }

  getRoadWetness(): number {
    if (this.activeWeather === WeatherType.RAIN) return 0.5;
    if (this.activeWeather === WeatherType.HEAVY_RAIN) return 0.8;
    return 0;
  }

  getSnowAmount(): number {
    return this.activeWeather === WeatherType.SNOW ? 1.0 : 0.0;
  }

  dispose(): void {
    // Dispose is handled by the mesh helper
  }
}
