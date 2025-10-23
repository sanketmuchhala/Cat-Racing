import * as THREE from 'three';

/**
 * Road shader with dashed centerline and surface effects
 */
export function createRoadMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRoadColor: { value: new THREE.Color(0x505050) },
      uLineColor: { value: new THREE.Color(0xffffff) },
      uDashScale: { value: 20.0 },
      uDashWidth: { value: 0.05 },
      uLineWidth: { value: 0.02 },
      uWetness: { value: 0.0 },
      uSnowAmount: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uRoadColor;
      uniform vec3 uLineColor;
      uniform float uDashScale;
      uniform float uDashWidth;
      uniform float uLineWidth;
      uniform float uWetness;
      uniform float uSnowAmount;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      // Simple noise function
      float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec3 color = uRoadColor;

        // Add subtle noise to road surface
        float surfaceNoise = noise(vWorldPos.xz * 5.0) * 0.1;
        color *= (1.0 + surfaceNoise);

        // Dashed centerline
        float centerDist = abs(vUv.x - 0.5);
        if (centerDist < uLineWidth) {
          float dashPattern = step(uDashWidth, fract(vUv.y * uDashScale));
          color = mix(uLineColor, color, dashPattern);
        }

        // Edge lines
        float edgeWidth = 0.01;
        if (vUv.x < edgeWidth || vUv.x > 1.0 - edgeWidth) {
          color = mix(uLineColor, color, 0.5);
        }

        // Wetness effect (darker + reflective)
        if (uWetness > 0.01) {
          color = mix(color, color * 0.6, uWetness);

          // Subtle reflection effect
          float reflection = max(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0);
          color = mix(color, color * 1.2, reflection * uWetness * 0.3);
        }

        // Snow effect (lighter)
        if (uSnowAmount > 0.01) {
          vec3 snowColor = vec3(0.95, 0.95, 0.98);
          float snowPattern = smoothstep(0.4, 0.6, noise(vWorldPos.xz * 10.0));
          color = mix(color, snowColor, uSnowAmount * snowPattern);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
