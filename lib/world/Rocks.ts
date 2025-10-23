import * as THREE from 'three';
import { InstancedMeshHelper } from '../util/Instancing';

/**
 * Rocks and boulders for landscape variety
 */
export class Rocks {
  private rocks: InstancedMeshHelper;
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    // Create rock geometry (irregular sphere for natural look)
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.rocks = new InstancedMeshHelper(rockGeo, rockMat, 150);
    this.group.add(this.rocks.getMesh());
  }

  update(cameraX: number, cameraZ: number): void {
    // Clear old rocks
    this.rocks.reset();

    // Generate rocks around camera
    const gridSize = 8;
    const spacing = 20;
    const roadClearance = 15; // Keep away from road

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        const worldX = cameraX + x * spacing;
        const worldZ = cameraZ + z * spacing;

        // Don't place rocks on or near the road
        if (Math.abs(worldX) < roadClearance) continue;

        // Random placement offset
        const offsetX = (Math.random() - 0.5) * spacing * 0.7;
        const offsetZ = (Math.random() - 0.5) * spacing * 0.7;

        const rockX = worldX + offsetX;
        const rockZ = worldZ + offsetZ;

        // Sparse rock placement
        if (Math.random() > 0.7) {
          this.createRock(rockX, rockZ);
        }
      }
    }

    this.rocks.finalize();
  }

  private createRock(x: number, z: number): void {
    const y = 0.5; // Ground level

    // Random size variation
    const size = 0.5 + Math.random() * 1.5;

    this.rocks.addInstance(
      new THREE.Vector3(x, y, z),
      new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      new THREE.Vector3(size, size * (0.8 + Math.random() * 0.4), size)
    );
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  dispose(): void {
    // Cleanup handled by instancing helper
  }
}
