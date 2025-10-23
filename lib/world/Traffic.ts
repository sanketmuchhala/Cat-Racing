import * as THREE from 'three';

/**
 * Simple traffic system with AI cars
 */
interface TrafficCar {
  mesh: THREE.Mesh;
  speed: number;
  lane: number; // -1 = left, 0 = center, 1 = right
  distance: number;
  direction: number; // 1 = forward (same as player), -1 = oncoming
}

export class Traffic {
  private cars: TrafficCar[] = [];
  private group: THREE.Group;
  private maxCars = 8;
  private carColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xff8b94];

  constructor() {
    this.group = new THREE.Group();

    // Spawn initial traffic cars (mix of forward and oncoming)
    for (let i = 0; i < 3; i++) {
      this.spawnCar(20 + i * 30, 1); // Forward traffic
    }
    for (let i = 0; i < 3; i++) {
      this.spawnCar(50 + i * 40, -1); // Oncoming traffic
    }
  }

  update(dt: number, playerZ: number, playerSpeed: number): void {
    // Remove cars that are too far behind or ahead
    this.cars = this.cars.filter((car) => {
      const isTooFar = car.direction === 1
        ? car.distance < playerZ - 100  // Forward cars behind player
        : car.distance > playerZ + 100; // Oncoming cars ahead of player

      if (isTooFar) {
        this.group.remove(car.mesh);
        car.mesh.geometry.dispose();
        (car.mesh.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });

    // Count forward and oncoming cars
    const forwardCars = this.cars.filter(c => c.direction === 1).length;
    const oncomingCars = this.cars.filter(c => c.direction === -1).length;

    // Spawn new forward cars ahead
    if (forwardCars < this.maxCars / 2) {
      this.spawnCar(playerZ + 50 + Math.random() * 50, 1);
    }

    // Spawn new oncoming cars ahead
    if (oncomingCars < this.maxCars / 2) {
      this.spawnCar(playerZ + 80 + Math.random() * 60, -1);
    }

    // Update car positions
    this.cars.forEach((car) => {
      // Update distance based on direction
      const moveSpeed = car.speed * car.direction;
      car.distance += moveSpeed * dt;

      // Lane offset (oncoming cars use opposite side lanes)
      let laneOffset = car.lane * 2.5;
      if (car.direction === -1) {
        laneOffset = -laneOffset; // Flip to opposite side for oncoming
      }

      // Update mesh position (elevated to match road)
      car.mesh.position.set(laneOffset, 0.55, car.distance);

      // Rotate oncoming cars to face the correct direction
      if (car.direction === -1) {
        car.mesh.rotation.y = Math.PI; // 180 degrees
      }
    });
  }

  private spawnCar(distance: number, direction: number = 1): void {
    // Choose random lane (for oncoming, stay in their lanes which will be flipped)
    const lane = Math.floor(Math.random() * 2) - 0.5; // -0.5 or 0.5 for 2 lanes per side

    // Create simple car mesh
    const geometry = new THREE.BoxGeometry(1.8, 1, 3.5);
    const color = this.carColors[Math.floor(Math.random() * this.carColors.length)];
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.5,
      roughness: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    const car: TrafficCar = {
      mesh,
      speed: 20 + Math.random() * 10,
      lane,
      distance,
      direction,
    };

    this.cars.push(car);
    this.group.add(mesh);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  getCars(): Array<{ position: THREE.Vector3; lane: number; direction: number }> {
    return this.cars.map((car) => ({
      position: car.mesh.position.clone(),
      lane: car.lane,
      direction: car.direction,
    }));
  }

  setEnabled(enabled: boolean): void {
    this.group.visible = enabled;
  }

  dispose(): void {
    this.cars.forEach((car) => {
      car.mesh.geometry.dispose();
      (car.mesh.material as THREE.Material).dispose();
    });
    this.cars = [];
  }
}
