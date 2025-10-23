import * as THREE from 'three';
import { Noise } from '../math/Noise';
import { createTerrainMaterial } from './TerrainShader';

/**
 * Chunked terrain system with LOD
 */
interface TerrainChunk {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  distance: number;
}

export class Terrain {
  private chunks: Map<string, TerrainChunk> = new Map();
  private material: THREE.ShaderMaterial;
  private noise: Noise;
  private group: THREE.Group;

  private readonly chunkSize = 50;
  private readonly chunkSegments = 48; // Higher segments for smoother terrain
  private readonly chunkSegmentsLOD = 32;
  private readonly viewDistance = 250;
  private readonly heightScale = 5; // Even gentler hills
  private readonly waterLevel = -2; // Lower water level to create visible lakes

  constructor() {
    this.noise = new Noise();
    this.material = createTerrainMaterial();
    this.group = new THREE.Group();

    // Pre-generate initial chunks around origin for stable start
    const chunksRadius = 3;
    for (let x = -chunksRadius; x <= chunksRadius; x++) {
      for (let z = -chunksRadius; z <= chunksRadius; z++) {
        this.createChunk(x, z, 0, 0);
      }
    }
  }

  update(cameraX: number, cameraZ: number): void {
    // Determine which chunks should be visible
    const centerChunkX = Math.floor(cameraX / this.chunkSize);
    const centerChunkZ = Math.floor(cameraZ / this.chunkSize);
    const chunksRadius = Math.ceil(this.viewDistance / this.chunkSize);

    // Track which chunks we need
    const neededChunks = new Set<string>();

    for (let x = centerChunkX - chunksRadius; x <= centerChunkX + chunksRadius; x++) {
      for (let z = centerChunkZ - chunksRadius; z <= centerChunkZ + chunksRadius; z++) {
        const key = `${x},${z}`;
        neededChunks.add(key);

        if (!this.chunks.has(key)) {
          this.createChunk(x, z, cameraX, cameraZ);
        } else {
          // Update distance
          const chunk = this.chunks.get(key)!;
          const worldX = x * this.chunkSize + this.chunkSize / 2;
          const worldZ = z * this.chunkSize + this.chunkSize / 2;
          chunk.distance = Math.sqrt(
            (worldX - cameraX) ** 2 + (worldZ - cameraZ) ** 2
          );
        }
      }
    }

    // Remove chunks that are too far
    const chunksToRemove: string[] = [];
    this.chunks.forEach((chunk, key) => {
      if (!neededChunks.has(key)) {
        chunksToRemove.push(key);
      }
    });

    chunksToRemove.forEach((key) => {
      const chunk = this.chunks.get(key)!;
      this.group.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      this.chunks.delete(key);
    });

    // Keep all chunks visible (no LOD flickering)
    this.chunks.forEach((chunk) => {
      chunk.mesh.visible = true;
      chunk.mesh.frustumCulled = false; // Prevent culling artifacts
    });
  }

  private createChunk(chunkX: number, chunkZ: number, cameraX: number, cameraZ: number): void {
    const worldX = chunkX * this.chunkSize + this.chunkSize / 2;
    const worldZ = chunkZ * this.chunkSize + this.chunkSize / 2;
    const distance = Math.sqrt((worldX - cameraX) ** 2 + (worldZ - cameraZ) ** 2);

    // Choose LOD based on distance
    const segments =
      distance > this.viewDistance * 0.6 ? this.chunkSegmentsLOD : this.chunkSegments;

    const geometry = new THREE.PlaneGeometry(
      this.chunkSize,
      this.chunkSize,
      segments,
      segments
    );

    // Generate height map
    const positions = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const localX = positions[i];
      const localZ = positions[i + 1];
      const globalX = chunkX * this.chunkSize + localX;
      const globalZ = chunkZ * this.chunkSize + localZ;

      // Get height from noise with smoother frequency
      let height = this.noise.getHeight(globalX, globalZ, 0.02) * this.heightScale;

      // Add gentle detail with higher frequency noise
      height += this.noise.fbm(globalX * 0.05, globalZ * 0.05, 3, 0.3, 2.0) * 1.5;

      // Cut out the road area - make terrain much lower where road is
      const roadWidth = 16; // Wide cutout for 12-unit road plus margins
      const distanceFromRoad = Math.abs(globalX);
      if (distanceFromRoad < roadWidth) {
        // Aggressively lower terrain in road area
        const edgeFactor = Math.pow(distanceFromRoad / roadWidth, 2.5); // Strong falloff
        const roadHeight = -5.0; // Much lower than road to prevent any overlap
        height = THREE.MathUtils.lerp(roadHeight, height, edgeFactor);
      }

      positions[i + 2] = Math.max(height, this.waterLevel);
    }

    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.position.set(chunkX * this.chunkSize, 0, chunkZ * this.chunkSize);
    mesh.receiveShadow = true;
    mesh.frustumCulled = false; // Prevent culling artifacts

    const chunk: TerrainChunk = {
      mesh,
      x: chunkX,
      z: chunkZ,
      distance,
    };

    const key = `${chunkX},${chunkZ}`;
    this.chunks.set(key, chunk);
    this.group.add(mesh);
  }

  updateColors(color1: THREE.Color, color2: THREE.Color): void {
    this.material.uniforms.uColor1.value.copy(color1);
    this.material.uniforms.uColor2.value.copy(color2);
  }

  setSnowAmount(amount: number, snowLevel: number): void {
    this.material.uniforms.uSnowAmount.value = amount;
    this.material.uniforms.uSnowLevel.value = snowLevel;
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  getHeightAt(x: number, z: number): number {
    let height = this.noise.getHeight(x, z, 0.03) * this.heightScale;
    height += this.noise.fbm(x * 0.1, z * 0.1, 2, 0.4, 2.5) * 2;
    return Math.max(height, this.waterLevel);
  }

  dispose(): void {
    this.chunks.forEach((chunk) => {
      chunk.mesh.geometry.dispose();
    });
    this.material.dispose();
    this.chunks.clear();
  }
}
