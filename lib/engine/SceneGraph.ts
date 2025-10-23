import * as THREE from 'three';

/**
 * Scene graph manager
 */
export class SceneGraph {
  scene: THREE.Scene;
  private lights: {
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
    hemisphere: THREE.HemisphereLight;
  };

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

    // Lights
    this.lights = {
      ambient: new THREE.AmbientLight(0xffffff, 0.4),
      directional: new THREE.DirectionalLight(0xffffff, 1.0),
      hemisphere: new THREE.HemisphereLight(0x87ceeb, 0x6b8e23, 0.5),
    };

    this.lights.directional.position.set(50, 100, 50);
    this.lights.directional.castShadow = true;
    this.lights.directional.shadow.camera.near = 0.5;
    this.lights.directional.shadow.camera.far = 500;
    this.lights.directional.shadow.camera.left = -100;
    this.lights.directional.shadow.camera.right = 100;
    this.lights.directional.shadow.camera.top = 100;
    this.lights.directional.shadow.camera.bottom = -100;
    this.lights.directional.shadow.mapSize.width = 2048;
    this.lights.directional.shadow.mapSize.height = 2048;

    this.scene.add(this.lights.ambient);
    this.scene.add(this.lights.directional);
    this.scene.add(this.lights.hemisphere);
  }

  updateLighting(
    sunDirection: THREE.Vector3,
    sunColor: THREE.Color,
    ambientColor: THREE.Color,
    skyColor: THREE.Color,
    groundColor: THREE.Color
  ): void {
    this.lights.directional.position.copy(sunDirection.multiplyScalar(100));
    this.lights.directional.color.copy(sunColor);
    this.lights.ambient.color.copy(ambientColor);
    this.lights.hemisphere.color.copy(skyColor);
    this.lights.hemisphere.groundColor.copy(groundColor);
  }

  updateFog(color: THREE.Color, density: number): void {
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(color);
      this.scene.fog.density = density;
    }
  }

  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  clear(): void {
    // Remove all objects except lights
    const objectsToRemove: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Light) && obj !== this.scene) {
        objectsToRemove.push(obj);
      }
    });
    objectsToRemove.forEach((obj) => this.scene.remove(obj));
  }
}
