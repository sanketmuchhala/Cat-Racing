/**
 * Game loop with fixed timestep for physics and variable rendering
 */
export class Loop {
  private running = false;
  private rafId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDeltaTime = 1 / 60; // 60 Hz physics
  private readonly maxAccumulator = 0.25; // Prevent spiral of death

  private updateCallback: (dt: number) => void;
  private renderCallback: (alpha: number) => void;

  constructor(
    updateCallback: (dt: number) => void,
    renderCallback: (alpha: number) => void
  ) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    if (!this.running) return;

    const currentTime = performance.now() / 1000;
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp delta to prevent spiral of death
    if (deltaTime > this.maxAccumulator) {
      deltaTime = this.maxAccumulator;
    }

    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDeltaTime) {
      this.updateCallback(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    // Render with interpolation alpha
    const alpha = this.accumulator / this.fixedDeltaTime;
    this.renderCallback(alpha);

    this.rafId = requestAnimationFrame(this.tick);
  };

  isRunning(): boolean {
    return this.running;
  }
}
