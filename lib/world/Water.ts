import * as THREE from 'three';

/**
 * Water planes with shimmer effect
 */
export class Water {
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private time = 0;

  constructor(size = 500) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaterColor: { value: new THREE.Color(0x4a90e2) },
        uFoamColor: { value: new THREE.Color(0xffffff) },
        uShoreDistance: { value: 2.0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uWaterColor;
        uniform vec3 uFoamColor;
        uniform float uShoreDistance;

        varying vec3 vWorldPos;
        varying vec2 vUv;

        // FBM noise for water waves
        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;

          for (int i = 0; i < 3; i++) {
            value += amplitude * noise(st * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }

          return value;
        }

        void main() {
          vec2 uv = vWorldPos.xz * 0.05;

          // Animated water waves
          float wave1 = fbm(uv + uTime * 0.05);
          float wave2 = fbm(uv * 1.5 - uTime * 0.03);
          float waves = (wave1 + wave2) * 0.5;

          // Shimmer effect
          float shimmer = smoothstep(0.4, 0.6, waves);
          vec3 color = mix(uWaterColor, uWaterColor * 1.3, shimmer * 0.3);

          // Foam pattern
          float foam = smoothstep(0.7, 0.9, waves);
          color = mix(color, uFoamColor, foam * 0.2);

          // Add subtle transparency variation
          float alpha = 0.85 + shimmer * 0.15;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
    geometry.rotateX(-Math.PI / 2);

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false; // Water should always render
  }

  update(dt: number): void {
    this.time += dt;
    this.material.uniforms.uTime.value = this.time;
  }

  updateColor(waterColor: THREE.Color): void {
    this.material.uniforms.uWaterColor.value.copy(waterColor);
  }

  setPosition(y: number): void {
    this.mesh.position.y = y;
  }

  updatePosition(cameraX: number, cameraZ: number): void {
    // Keep water centered on camera (only X and Z, Y stays at water level)
    this.mesh.position.x = cameraX;
    this.mesh.position.z = cameraZ;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
