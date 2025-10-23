import * as THREE from 'three';

/**
 * Simple traffic system with AI cars
 */
interface TrafficCar {
  mesh: THREE.Mesh;
  speed: number;
  lane: number; // -1 = left, 0 = center, 1 = right
  distance: number;
}

export class Traffic {
  private cars: TrafficCar[] = [];
  private group: THREE.Group;
  private maxCars = 8;
  private carColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xff8b94];

  constructor() {
    this.group = new THREE.Group();
  }

  update(dt: number, playerZ: number, playerSpeed: number): void {
    // Remove cars that are too far behind
    this.cars = this.cars.filter((car) => {
      if (car.distance < playerZ - 100) {
        this.group.remove(car.mesh);
        car.mesh.geometry.dispose();
        (car.mesh.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });

    // Spawn new cars ahead
    if (this.cars.length < this.maxCars) {
      this.spawnCar(playerZ + 50 + Math.random() * 50);
    }

    // Update car positions
    this.cars.forEach((car) => {
      // Cars drive at slightly varying speeds
      car.speed = 20 + Math.random() * 10;

      // Update distance
      car.distance += car.speed * dt;

      // Update mesh position
      const laneOffset = car.lane * 2.5;
      car.mesh.position.set(laneOffset, 0.5, car.distance);

      // Simple lane-keeping and avoidance (TODO: improve)
      // For now, cars just stay in their lane
    });
  }

  private spawnCar(distance: number): void {
    // Choose random lane
    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

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
    };

    this.cars.push(car);
    this.group.add(mesh);
  }

  getGroup(): THREE.Group {
    return this.group;
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
