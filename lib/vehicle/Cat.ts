import * as THREE from 'three';

/**
 * Cute cat with idle animations
 */
export class Cat {
  group: THREE.Group;
  private ears: THREE.Mesh[] = [];
  private tail!: THREE.Mesh;
  private head!: THREE.Mesh;
  private eyes: THREE.Mesh[] = [];

  private animationTime = 0;
  private blinkTimer = 0;
  private nextBlinkTime = 3;

  constructor() {
    this.group = new THREE.Group();

    // Create cat model
    this.createCat();

    // Position cat in passenger seat (relative to car)
    this.group.position.set(0.4, 0.6, 0.3);
    this.group.scale.setScalar(0.5);
  }

  private createCat(): void {
    const catMat = new THREE.MeshStandardMaterial({
      color: 0xffa500, // Orange cat
      roughness: 0.8,
    });

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.5, 0.8);
    const body = new THREE.Mesh(bodyGeo, catMat);
    body.position.y = 0;
    body.castShadow = true;
    this.group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.45);
    this.head = new THREE.Mesh(headGeo, catMat);
    this.head.position.set(0, 0.35, 0.3);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
    const leftEar = new THREE.Mesh(earGeo, catMat);
    leftEar.position.set(-0.18, 0.65, 0.25);
    leftEar.castShadow = true;
    this.ears.push(leftEar);
    this.group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, catMat);
    rightEar.position.set(0.18, 0.65, 0.25);
    rightEar.castShadow = true;
    this.ears.push(rightEar);
    this.group.add(rightEar);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x88ff88, // Green eyes
      emissive: 0x44aa44,
      emissiveIntensity: 0.3,
    });
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 0.4, 0.52);
    this.eyes.push(leftEye);
    this.group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 0.4, 0.52);
    this.eyes.push(rightEye);
    this.group.add(rightEye);

    // Pupils
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.12, 0.4, 0.58);
    this.group.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.12, 0.4, 0.58);
    this.group.add(rightPupil);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xff6b9d });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.32, 0.54);
    this.group.add(nose);

    // Tail
    const tailGeo = new THREE.CylinderGeometry(0.08, 0.05, 1.0, 8);
    this.tail = new THREE.Mesh(tailGeo, catMat);
    this.tail.position.set(0.2, 0.3, -0.5);
    this.tail.rotation.x = Math.PI * 0.3;
    this.tail.rotation.z = -Math.PI * 0.2;
    this.tail.castShadow = true;
    this.group.add(this.tail);

    // Paws
    const pawGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    const pawPositions = [
      { x: -0.2, z: 0.25 },
      { x: 0.2, z: 0.25 },
      { x: -0.2, z: -0.15 },
      { x: 0.2, z: -0.15 },
    ];

    pawPositions.forEach((pos) => {
      const paw = new THREE.Mesh(pawGeo, catMat);
      paw.position.set(pos.x, -0.4, pos.z);
      paw.castShadow = true;
      this.group.add(paw);
    });
  }

  update(dt: number, carSpeed: number): void {
    this.animationTime += dt;
    this.blinkTimer += dt;

    // Idle head bob
    const headBob = Math.sin(this.animationTime * 2) * 0.02;
    this.head.position.y = 0.35 + headBob;

    // Ear twitch
    if (Math.random() < 0.01) {
      // Random ear twitch
      const ear = this.ears[Math.floor(Math.random() * 2)];
      ear.rotation.z = (Math.random() - 0.5) * 0.3;
      setTimeout(() => {
        ear.rotation.z = 0;
      }, 200);
    }

    // Tail sway
    const tailSway = Math.sin(this.animationTime * 1.5) * 0.3;
    this.tail.rotation.z = -Math.PI * 0.2 + tailSway;

    // Celebratory purr wiggle at high speed (>120 km/h)
    if (carSpeed > 33.33) {
      // 33.33 m/s = 120 km/h
      const purrWiggle = Math.sin(this.animationTime * 10) * 0.05;
      this.group.rotation.y = purrWiggle;
      this.head.rotation.x = Math.abs(Math.sin(this.animationTime * 8)) * 0.1;
    } else {
      this.group.rotation.y = 0;
      this.head.rotation.x = 0;
    }

    // Blinking
    if (this.blinkTimer >= this.nextBlinkTime) {
      this.blink();
      this.blinkTimer = 0;
      this.nextBlinkTime = 2 + Math.random() * 3;
    }
  }

  private blink(): void {
    // Quick eye close/open
    this.eyes.forEach((eye) => {
      eye.scale.y = 0.1;
    });

    setTimeout(() => {
      this.eyes.forEach((eye) => {
        eye.scale.y = 1;
      });
    }, 150);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  dispose(): void {
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
