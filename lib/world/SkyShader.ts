import * as THREE from 'three';

/**
 * Procedural sky shader with sun/moon and gradient
 */
export class SkyShader {
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(0x87ceeb) },
        uHorizonColor: { value: new THREE.Color(0xb0e0e6) },
        uSunPosition: { value: new THREE.Vector3(50, 50, 50) },
        uSunColor: { value: new THREE.Color(0xfffacd) },
        uSunSize: { value: 0.05 },
        uMoonPosition: { value: new THREE.Vector3(-50, -50, -50) },
        uMoonColor: { value: new THREE.Color(0xccccff) },
        uMoonSize: { value: 0.03 },
        uTimeOfDay: { value: 0.5 }, // 0 = midnight, 0.5 = noon, 1 = midnight
      },
      vertexShader: `
        varying vec3 vWorldPosition;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunPosition;
        uniform vec3 uSunColor;
        uniform float uSunSize;
        uniform vec3 uMoonPosition;
        uniform vec3 uMoonColor;
        uniform float uMoonSize;
        uniform float uTimeOfDay;

        varying vec3 vWorldPosition;

        void main() {
          vec3 viewDir = normalize(vWorldPosition);
          float height = viewDir.y;

          // Sky gradient based on height
          float horizonMix = pow(1.0 - abs(height), 2.0);
          vec3 skyColor = mix(uTopColor, uHorizonColor, horizonMix);

          // Sun
          vec3 sunDir = normalize(uSunPosition);
          float sunDist = distance(viewDir, sunDir);
          float sunIntensity = smoothstep(uSunSize, uSunSize * 0.5, sunDist);
          float sunGlow = smoothstep(uSunSize * 3.0, uSunSize * 0.8, sunDist) * 0.3;
          skyColor = mix(skyColor, uSunColor, sunIntensity + sunGlow);

          // Moon
          vec3 moonDir = normalize(uMoonPosition);
          float moonDist = distance(viewDir, moonDir);
          float moonIntensity = smoothstep(uMoonSize, uMoonSize * 0.5, moonDist);
          float moonGlow = smoothstep(uMoonSize * 2.0, uMoonSize * 0.8, moonDist) * 0.2;
          skyColor = mix(skyColor, uMoonColor, moonIntensity + moonGlow);

          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    // Create sky sphere
    const geometry = new THREE.SphereGeometry(500, 32, 32);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = -1;
    this.mesh.frustumCulled = false; // Sky should always render
  }

  update(
    topColor: THREE.Color,
    horizonColor: THREE.Color,
    sunColor: THREE.Color,
    timeOfDay: number
  ): void {
    this.material.uniforms.uTopColor.value.copy(topColor);
    this.material.uniforms.uHorizonColor.value.copy(horizonColor);
    this.material.uniforms.uSunColor.value.copy(sunColor);
    this.material.uniforms.uTimeOfDay.value = timeOfDay;

    // Calculate sun/moon positions based on time of day
    const angle = timeOfDay * Math.PI * 2;
    const sunHeight = Math.sin(angle);
    const sunDist = Math.cos(angle);

    this.material.uniforms.uSunPosition.value.set(
      sunDist * 100,
      sunHeight * 100,
      50
    );

    this.material.uniforms.uMoonPosition.value.set(
      -sunDist * 100,
      -sunHeight * 100,
      -50
    );
  }

  getSunDirection(): THREE.Vector3 {
    return this.material.uniforms.uSunPosition.value.clone().normalize();
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  updatePosition(cameraPosition: THREE.Vector3): void {
    // Keep sky centered on camera
    this.mesh.position.copy(cameraPosition);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
