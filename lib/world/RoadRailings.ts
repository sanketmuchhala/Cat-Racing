import * as THREE from 'three';

/**
 * Road railings/barriers to keep car on track
 */
export class RoadRailings {
  private group: THREE.Group;
  private railings: THREE.Mesh[] = [];
  private readonly railingSpacing = 5;
  private readonly roadWidth = 12; // Match wider road

  constructor() {
    this.group = new THREE.Group();

    // Create initial railings
    for (let z = -50; z < 100; z += this.railingSpacing) {
      this.createRailingPair(z);
    }
  }

  update(playerZ: number): void {
    // Remove old railings
    this.railings = this.railings.filter((railing) => {
      if (railing.position.z < playerZ - 50) {
        this.group.remove(railing);
        railing.geometry.dispose();
        (railing.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });

    // Add new railings ahead
    const farthestZ = this.railings.length > 0
      ? Math.max(...this.railings.map(r => r.position.z))
      : playerZ;

    const targetZ = playerZ + 100;
    for (let z = farthestZ + this.railingSpacing; z < targetZ; z += this.railingSpacing) {
      this.createRailingPair(z);
    }
  }

  private createRailingPair(z: number): void {
    // Left railing
    const leftRailing = this.createRailing();
    leftRailing.position.set(-this.roadWidth / 2, 0.55, z); // Slightly elevated to match road
    this.group.add(leftRailing);
    this.railings.push(leftRailing);

    // Right railing
    const rightRailing = this.createRailing();
    rightRailing.position.set(this.roadWidth / 2, 0.55, z); // Slightly elevated to match road
    this.group.add(rightRailing);
    this.railings.push(rightRailing);
  }

  private createRailing(): THREE.Mesh {
    // Create highway-style guard rail barrier
    const group = new THREE.Group();

    // Horizontal rail (the metal barrier)
    const railGeo = new THREE.BoxGeometry(0.3, 0.15, 4);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, // Silver metal
      metalness: 0.8,
      roughness: 0.3,
    });
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.y = 0.5;
    rail.castShadow = true;
    group.add(rail);

    // Support post
    const postGeo = new THREE.BoxGeometry(0.15, 1, 0.15);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.5,
      roughness: 0.6,
    });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 0;
    post.castShadow = true;
    group.add(post);

    const mesh = new THREE.Mesh();
    mesh.add(group);
    return mesh;
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  dispose(): void {
    this.railings.forEach((railing) => {
      railing.geometry.dispose();
      (railing.material as THREE.Material).dispose();
    });
    this.railings = [];
  }
}
