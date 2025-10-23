import * as THREE from 'three';

/**
 * Kinematic car with simple physics
 */
export interface CarConfig {
  maxSpeed?: number;
  acceleration?: number;
  deceleration?: number;
  turnSpeed?: number;
  driftFactor?: number;
}

export class Car {
  group: THREE.Group;
  private wheels: THREE.Mesh[] = [];
  private body: THREE.Mesh;

  // Physics state
  position = new THREE.Vector3();
  velocity = new THREE.Vector3();
  forward = new THREE.Vector3(0, 0, 1);
  right = new THREE.Vector3(1, 0, 0);

  speed = 0;
  steerAngle = 0;

  // Config
  private maxSpeed: number;
  private acceleration: number;
  private deceleration: number;
  private turnSpeed: number;
  private driftFactor: number;

  // Suspension
  private suspensionOffset = 0;
  private suspensionTime = 0;

  // Anti-rollover
  private rollAngle = 0;
  private readonly maxRollAngle = Math.PI / 6; // 30 degrees max roll
  private readonly rollRecoverySpeed = 2.0; // How fast to recover from roll

  constructor(config: CarConfig = {}) {
    this.maxSpeed = config.maxSpeed ?? 60;
    this.acceleration = config.acceleration ?? 15;
    this.deceleration = config.deceleration ?? 5;
    this.turnSpeed = config.turnSpeed ?? 2;
    this.driftFactor = config.driftFactor ?? 0.95;

    this.group = new THREE.Group();

    // Create car model
    this.body = this.createBody();
    this.group.add(this.body);

    // Create wheels
    const wheelPositions = [
      { x: -0.7, z: 1.2 },  // Front left
      { x: 0.7, z: 1.2 },   // Front right
      { x: -0.7, z: -1.2 }, // Rear left
      { x: 0.7, z: -1.2 },  // Rear right
    ];

    wheelPositions.forEach((pos) => {
      const wheel = this.createWheel();
      wheel.position.set(pos.x, -0.2, pos.z);
      this.wheels.push(wheel);
      this.group.add(wheel);
    });
  }

  private createBody(): THREE.Mesh {
    // Create a low-poly car body using primitives
    const bodyGroup = new THREE.Group();

    // Main body
    const mainBodyGeo = new THREE.BoxGeometry(1.6, 0.6, 3);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White car for visibility
      metalness: 0.6,
      roughness: 0.4,
    });
    const mainBody = new THREE.Mesh(mainBodyGeo, bodyMat);
    mainBody.position.y = 0.3;
    mainBody.castShadow = true;
    bodyGroup.add(mainBody);

    // Cabin (windshield area)
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.5, 1.5);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.85, 0.2);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    // Hood
    const hoodGeo = new THREE.BoxGeometry(1.4, 0.2, 0.8);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.4, 1.4);
    hood.castShadow = true;
    bodyGroup.add(hood);

    // Headlights
    const headlightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.5,
    });
    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-0.5, 0.3, 1.85);
    bodyGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(0.5, 0.3, 1.85);
    bodyGroup.add(rightHeadlight);

    const mesh = new THREE.Mesh();
    mesh.add(bodyGroup);
    return mesh;
  }

  private createWheel(): THREE.Mesh {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    const mesh = new THREE.Mesh();
    mesh.add(wheelGroup);
    return mesh;
  }

  update(dt: number, throttle: number, steering: number, brake: number): void {
    // Update steering
    this.steerAngle = THREE.MathUtils.lerp(
      this.steerAngle,
      steering * this.turnSpeed,
      0.1
    );

    // Update speed
    if (throttle > 0) {
      this.speed += this.acceleration * throttle * dt;
    } else if (brake > 0) {
      this.speed -= this.deceleration * brake * dt * 2;
    } else {
      // Natural deceleration
      this.speed -= this.deceleration * dt;
    }

    this.speed = THREE.MathUtils.clamp(this.speed, 0, this.maxSpeed);

    // Update direction based on steering
    if (Math.abs(this.speed) > 0.1) {
      const turnAmount = this.steerAngle * (this.speed / this.maxSpeed) * dt;
      const rotation = new THREE.Matrix4().makeRotationY(-turnAmount);
      this.forward.applyMatrix4(rotation);
      this.forward.normalize();
      this.right.crossVectors(new THREE.Vector3(0, 1, 0), this.forward);
    }

    // Update velocity with drift
    const targetVelocity = this.forward.clone().multiplyScalar(this.speed);
    this.velocity.lerp(targetVelocity, this.driftFactor);

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    // Keep car on road (constrain X position)
    const roadWidth = 10; // Road is 12 units wide, leave small margin
    this.position.x = THREE.MathUtils.clamp(this.position.x, -roadWidth / 2, roadWidth / 2);

    // Keep car at road height
    this.position.y = 0.55; // Match elevated road height

    // Update group transform
    this.group.position.copy(this.position);
    this.group.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      this.forward
    );

    // Suspension bob
    this.suspensionTime += dt * 10;
    this.suspensionOffset = Math.sin(this.suspensionTime) * 0.02 * (this.speed / this.maxSpeed);
    this.body.position.y = 0 + this.suspensionOffset;

    // Wheel rotation
    const wheelRotation = (this.speed / this.maxSpeed) * dt * 10;
    this.wheels.forEach((wheel, i) => {
      wheel.rotateX(wheelRotation);

      // Front wheels steer
      if (i < 2) {
        wheel.rotation.y = this.steerAngle * 0.4;
      }
    });

    // Anti-rollover: body tilt when turning with limits
    const targetRoll = -this.steerAngle * 0.08 * (this.speed / this.maxSpeed);

    // Smoothly interpolate to target roll
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, 0.15);

    // Clamp roll to prevent rollover
    this.rollAngle = THREE.MathUtils.clamp(
      this.rollAngle,
      -this.maxRollAngle,
      this.maxRollAngle
    );

    // If roll is extreme, add recovery force
    if (Math.abs(this.rollAngle) > this.maxRollAngle * 0.8) {
      this.rollAngle *= 1 - (this.rollRecoverySpeed * dt);
    }

    // Apply roll to car body
    this.group.rotation.z = this.rollAngle;

    // If car is nearly upside down, auto-recover
    if (Math.abs(this.group.rotation.z) > Math.PI / 2) {
      this.group.rotation.z = 0;
      this.rollAngle = 0;
      this.speed *= 0.5; // Slow down on recovery
    }
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getForward(): THREE.Vector3 {
    return this.forward.clone();
  }

  getSpeed(): number {
    return this.speed;
  }

  setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
    this.group.position.copy(position);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  dispose(): void {
    // Dispose geometries and materials
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
  }
}
