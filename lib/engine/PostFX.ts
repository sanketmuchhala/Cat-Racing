import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

/**
 * Post-processing effects manager
 */
export interface PostFXSettings {
  bloomEnabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  vignetteIntensity: number;
}

export class PostFX {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private fxaaPass: ShaderPass;
  private bloomPass: UnrealBloomPass;
  private vignettePass: ShaderPass;
  private settings: PostFXSettings;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    this.settings = {
      bloomEnabled: true,
      bloomStrength: 0.4,
      bloomRadius: 0.5,
      bloomThreshold: 0.8,
      vignetteIntensity: 0.3,
    };

    // Create composer
    this.composer = new EffectComposer(renderer);

    // Render pass
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // FXAA pass
    this.fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    const size = renderer.getSize(new THREE.Vector2());
    this.fxaaPass.material.uniforms['resolution'].value.x =
      1 / (size.width * pixelRatio);
    this.fxaaPass.material.uniforms['resolution'].value.y =
      1 / (size.height * pixelRatio);
    this.composer.addPass(this.fxaaPass);

    // Bloom pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      this.settings.bloomStrength,
      this.settings.bloomRadius,
      this.settings.bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    // Vignette pass
    this.vignettePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        intensity: { value: this.settings.vignetteIntensity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float intensity;
        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          float vignette = smoothstep(0.8, 0.2, dist);
          vignette = mix(1.0, vignette, intensity);
          gl_FragColor = vec4(color.rgb * vignette, color.a);
        }
      `,
    });
    this.composer.addPass(this.vignettePass);
  }

  render(): void {
    this.composer.render();
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(pixelRatio);

    // Update FXAA resolution
    this.fxaaPass.material.uniforms['resolution'].value.x =
      1 / (width * pixelRatio);
    this.fxaaPass.material.uniforms['resolution'].value.y =
      1 / (height * pixelRatio);

    // Update bloom resolution
    this.bloomPass.resolution.set(width, height);
  }

  updateSettings(settings: Partial<PostFXSettings>): void {
    this.settings = { ...this.settings, ...settings };

    this.bloomPass.enabled = this.settings.bloomEnabled;
    this.bloomPass.strength = this.settings.bloomStrength;
    this.bloomPass.radius = this.settings.bloomRadius;
    this.bloomPass.threshold = this.settings.bloomThreshold;

    if (this.vignettePass.uniforms?.['intensity']) {
      this.vignettePass.uniforms['intensity'].value =
        this.settings.vignetteIntensity;
    }
  }

  getSettings(): PostFXSettings {
    return { ...this.settings };
  }

  dispose(): void {
    this.composer.dispose();
  }
}
