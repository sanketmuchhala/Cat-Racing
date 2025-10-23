import * as THREE from 'three';

/**
 * Terrain shader with tri-planar mapping and seasonal variation
 */
export function createTerrainMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor1: { value: new THREE.Color(0x7ec850) },
      uColor2: { value: new THREE.Color(0x90ee90) },
      uRockColor: { value: new THREE.Color(0x808080) },
      uSnowColor: { value: new THREE.Color(0xffffff) },
      uSnowAmount: { value: 0.0 },
      uSnowLevel: { value: 10.0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vHeight;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(normalMatrix * normal);
        vHeight = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uRockColor;
      uniform vec3 uSnowColor;
      uniform float uSnowAmount;
      uniform float uSnowLevel;

      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying float vHeight;

      // Simple noise function
      float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        // Base color mixing based on height
        float heightMix = smoothstep(0.0, 5.0, vHeight);
        vec3 baseColor = mix(uColor1, uColor2, heightMix);

        // Add noise variation
        float n = noise(vWorldPos.xz * 0.5);
        baseColor = mix(baseColor, baseColor * 1.2, n * 0.2);

        // Tri-planar blending based on slope
        float slope = 1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));

        // Steeper slopes show rock color
        if (slope > 0.5) {
          baseColor = mix(baseColor, uRockColor, (slope - 0.5) * 2.0);
        }

        // Snow on high areas
        if (uSnowAmount > 0.01) {
          float snowFactor = smoothstep(uSnowLevel - 2.0, uSnowLevel, vHeight);
          snowFactor *= (1.0 - slope * 0.5); // Less snow on steep slopes

          // Add snow noise
          float snowNoise = noise(vWorldPos.xz * 2.0);
          snowFactor *= smoothstep(0.3, 0.7, snowNoise);

          baseColor = mix(baseColor, uSnowColor, snowFactor * uSnowAmount);
        }

        gl_FragColor = vec4(baseColor, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
