import * as THREE from 'three';

/**
 * Helper for GPU instancing
 */
export class InstancedMeshHelper {
  mesh: THREE.InstancedMesh;
  private count: number;
  private maxCount: number;
  private dummy = new THREE.Object3D();

  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxCount: number
  ) {
    this.maxCount = maxCount;
    this.count = 0;
    this.mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    this.mesh.frustumCulled = true;
  }

  addInstance(
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3
  ): number {
    if (this.count >= this.maxCount) {
      console.warn('InstancedMesh: max count reached');
      return -1;
    }

    this.dummy.position.copy(position);
    this.dummy.rotation.copy(rotation);
    this.dummy.scale.copy(scale);
    this.dummy.updateMatrix();

    this.mesh.setMatrixAt(this.count, this.dummy.matrix);
    this.count++;

    return this.count - 1;
  }

  updateInstance(
    index: number,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3
  ): void {
    if (index >= this.count) return;

    this.dummy.position.copy(position);
    this.dummy.rotation.copy(rotation);
    this.dummy.scale.copy(scale);
    this.dummy.updateMatrix();

    this.mesh.setMatrixAt(index, this.dummy.matrix);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  setColor(index: number, color: THREE.Color): void {
    if (!this.mesh.instanceColor) {
      this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(this.maxCount * 3),
        3
      );
    }

    this.mesh.setColorAt(index, color);
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  finalize(): void {
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.count = 0;
    this.mesh.count = 0;
  }

  getCount(): number {
    return this.count;
  }

  getMesh(): THREE.InstancedMesh {
    return this.mesh;
  }
}
