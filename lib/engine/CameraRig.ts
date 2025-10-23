import * as THREE from 'three';

/**
 * Camera rig with smooth chase camera and multiple modes
 */
export enum CameraMode {
  CHASE = 'chase',
  HOOD = 'hood',
  ORBIT = 'orbit',
}

export class CameraRig {
  camera: THREE.PerspectiveCamera;
  private mode: CameraMode = CameraMode.CHASE;
  private target = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private velocity = new THREE.Vector3();

  // Chase camera settings
  private readonly chaseDistance = 8;
  private readonly chaseHeight = 3;
  private readonly chaseDamping = 0.1;
  private readonly lookAtDamping = 0.15;

  // Orbit settings
  private orbitAngle = 0;
  private orbitRadius = 10;
  private orbitHeight = 5;

  // FOV shift with speed
  private baseFOV = 75;
  private maxFOVShift = 10;

  // Shake
  private shakeIntensity = 0;
  private shakeDecay = 5;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(this.baseFOV, aspect, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.currentPosition.copy(this.camera.position);
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  getMode(): CameraMode {
    return this.mode;
  }

  cycleMode(): void {
    const modes = [CameraMode.CHASE, CameraMode.HOOD, CameraMode.ORBIT];
    const currentIndex = modes.indexOf(this.mode);
    this.mode = modes[(currentIndex + 1) % modes.length];
  }

  update(
    dt: number,
    targetPosition: THREE.Vector3,
    targetForward: THREE.Vector3,
    speed: number
  ): void {
    this.target.copy(targetPosition);

    // Update FOV based on speed (km/h)
    const speedFactor = Math.min(speed / 200, 1);
    const targetFOV = this.baseFOV + this.maxFOVShift * speedFactor;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 0.05);
    this.camera.updateProjectionMatrix();

    // Apply shake
    if (this.shakeIntensity > 0.01) {
      this.shakeIntensity *= Math.exp(-this.shakeDecay * dt);
    }

    switch (this.mode) {
      case CameraMode.CHASE:
        this.updateChaseCamera(dt, targetPosition, targetForward);
        break;
      case CameraMode.HOOD:
        this.updateHoodCamera(dt, targetPosition, targetForward);
        break;
      case CameraMode.ORBIT:
        this.updateOrbitCamera(dt, targetPosition);
        break;
    }

    // Apply camera shake
    if (this.shakeIntensity > 0.01) {
      const shake = new THREE.Vector3(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      this.camera.position.add(shake);
    }
  }

  private updateChaseCamera(
    dt: number,
    targetPosition: THREE.Vector3,
    targetForward: THREE.Vector3
  ): void {
    // Target position behind and above the car
    const back = targetForward.clone().multiplyScalar(-1);
    const idealPosition = targetPosition
      .clone()
      .add(back.multiplyScalar(this.chaseDistance))
      .add(new THREE.Vector3(0, this.chaseHeight, 0));

    // Smooth camera position
    this.currentPosition.lerp(idealPosition, this.chaseDamping);
    this.camera.position.copy(this.currentPosition);

    // Smooth look-at
    const lookTarget = targetPosition.clone().add(new THREE.Vector3(0, 1, 0));
    this.currentLookAt.lerp(lookTarget, this.lookAtDamping);
    this.camera.lookAt(this.currentLookAt);
  }

  private updateHoodCamera(
    dt: number,
    targetPosition: THREE.Vector3,
    targetForward: THREE.Vector3
  ): void {
    // Position at the hood of the car
    const hoodOffset = targetForward.clone().multiplyScalar(2);
    const idealPosition = targetPosition
      .clone()
      .add(hoodOffset)
      .add(new THREE.Vector3(0, 1.2, 0));

    this.currentPosition.lerp(idealPosition, 0.2);
    this.camera.position.copy(this.currentPosition);

    // Look forward
    const lookTarget = targetPosition
      .clone()
      .add(targetForward.multiplyScalar(20))
      .add(new THREE.Vector3(0, 1, 0));
    this.currentLookAt.lerp(lookTarget, 0.25);
    this.camera.lookAt(this.currentLookAt);
  }

  private updateOrbitCamera(dt: number, targetPosition: THREE.Vector3): void {
    // Slowly orbit around the car
    this.orbitAngle += dt * 0.3;
    const x = Math.cos(this.orbitAngle) * this.orbitRadius;
    const z = Math.sin(this.orbitAngle) * this.orbitRadius;

    const idealPosition = targetPosition
      .clone()
      .add(new THREE.Vector3(x, this.orbitHeight, z));

    this.currentPosition.lerp(idealPosition, 0.05);
    this.camera.position.copy(this.currentPosition);

    // Always look at the car
    const lookTarget = targetPosition.clone().add(new THREE.Vector3(0, 1, 0));
    this.currentLookAt.lerp(lookTarget, 0.1);
    this.camera.lookAt(this.currentLookAt);
  }

  addShake(intensity: number): void {
    this.shakeIntensity += intensity;
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
