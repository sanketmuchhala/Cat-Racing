import * as THREE from 'three';
import { Loop } from './Loop';
import { Input } from './Input';
import { CameraRig } from './CameraRig';
import { PostFX } from './PostFX';
import { SceneGraph } from './SceneGraph';
import { Time } from '../util/Time';

/**
 * Main game engine
 */
export interface EngineConfig {
  canvas: HTMLCanvasElement;
  antialias?: boolean;
  powerPreference?: 'high-performance' | 'low-power' | 'default';
}

export class Engine {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  sceneGraph: SceneGraph;
  cameraRig: CameraRig;
  input: Input;
  postFX: PostFX;
  loop: Loop;

  private updateCallbacks: Array<(dt: number) => void> = [];
  private renderCallbacks: Array<(alpha: number) => void> = [];
  private resizeObserver: ResizeObserver | null = null;

  constructor(config: EngineConfig) {
    this.canvas = config.canvas;

    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: config.antialias ?? true,
      powerPreference: config.powerPreference ?? 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Initialize subsystems
    this.sceneGraph = new SceneGraph();
    this.cameraRig = new CameraRig(
      window.innerWidth / window.innerHeight
    );
    this.input = new Input();
    this.input.init(this.canvas);

    this.postFX = new PostFX(
      this.renderer,
      this.sceneGraph.scene,
      this.cameraRig.camera
    );

    // Initialize time
    Time.init();

    // Create game loop
    this.loop = new Loop(
      (dt: number) => this.update(dt),
      (alpha: number) => this.render(alpha)
    );

    // Setup resize observer
    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(this.canvas.parentElement || document.body);
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.cameraRig.resize(width / height);
    this.postFX.resize(width, height, pixelRatio);
  }

  onUpdate(callback: (dt: number) => void): void {
    this.updateCallbacks.push(callback);
  }

  onRender(callback: (alpha: number) => void): void {
    this.renderCallbacks.push(callback);
  }

  private update(dt: number): void {
    Time.update(performance.now());

    // Call all update callbacks
    this.updateCallbacks.forEach((cb) => cb(dt));

    // Reset input deltas
    this.input.reset();
  }

  private render(alpha: number): void {
    // Call all render callbacks
    this.renderCallbacks.forEach((cb) => cb(alpha));

    // Render with post-processing
    this.postFX.render();
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.postFX.dispose();
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }
}
