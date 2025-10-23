import * as THREE from 'three';
import { InstancedMeshHelper } from '../util/Instancing';

/**
 * Realistic trees for autumn landscape
 */
export class Trees {
  private trunks: InstancedMeshHelper;
  private foliage: InstancedMeshHelper;
  private group: THREE.Group;
  private treePositions: Array<{ x: number; z: number }> = [];

  constructor() {
    this.group = new THREE.Group();

    // Create tree trunks
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728, // Brown bark
      roughness: 0.9,
    });
    this.trunks = new InstancedMeshHelper(trunkGeo, trunkMat, 200);
    this.group.add(this.trunks.getMesh());

    // Create green foliage
    const foliageGeo = new THREE.SphereGeometry(2, 8, 8);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x228b22, // Forest green
      roughness: 0.8,
    });
    this.foliage = new InstancedMeshHelper(foliageGeo, foliageMat, 200);
    this.group.add(this.foliage.getMesh());
  }

  update(cameraX: number, cameraZ: number): void {
    // Clear old trees
    this.trunks.reset();
    this.foliage.reset();
    this.treePositions = [];

    // Generate trees around camera
    const gridSize = 10;
    const spacing = 15;
    const roadClearance = 50; // Keep very far from road for completely clear view

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        const worldX = cameraX + x * spacing;
        const worldZ = cameraZ + z * spacing;

        // Don't place trees on or near the road
        if (Math.abs(worldX) < roadClearance) continue;

        // Random placement offset
        const offsetX = (Math.random() - 0.5) * spacing * 0.5;
        const offsetZ = (Math.random() - 0.5) * spacing * 0.5;

        const treeX = worldX + offsetX;
        const treeZ = worldZ + offsetZ;

        // Only place trees very sparsely for maximum visibility
        if (Math.random() > 0.85) {
          this.createTree(treeX, treeZ);
        }
      }
    }

    this.trunks.finalize();
    this.foliage.finalize();
  }

  private createTree(x: number, z: number): void {
    const y = 0; // Ground level

    // Trunk
    this.trunks.addInstance(
      new THREE.Vector3(x, y + 2, z),
      new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
      new THREE.Vector3(1, 1, 1)
    );

    // Foliage (green colors variation)
    const colors = [
      new THREE.Color(0x228b22), // Forest green
      new THREE.Color(0x32cd32), // Lime green
      new THREE.Color(0x006400), // Dark green
      new THREE.Color(0x90ee90), // Light green
    ];
    const colorIndex = Math.floor(Math.random() * colors.length);

    const foliageIndex = this.foliage.addInstance(
      new THREE.Vector3(x, y + 5, z),
      new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
      new THREE.Vector3(
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4
      )
    );

    this.foliage.setColor(foliageIndex, colors[colorIndex]);

    this.treePositions.push({ x, z });
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  dispose(): void {
    // Cleanup handled by instancing helper
  }
}
