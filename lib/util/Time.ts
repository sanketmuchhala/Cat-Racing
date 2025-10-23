/**
 * Time management utilities for game loop
 */
export class Time {
  private static startTime = 0;
  private static lastFrameTime = 0;
  private static _deltaTime = 0;
  private static _elapsedTime = 0;
  private static _frameCount = 0;

  static init(): void {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
  }

  static update(currentTime: number): void {
    this._deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this._elapsedTime = (currentTime - this.startTime) / 1000;
    this.lastFrameTime = currentTime;
    this._frameCount++;
  }

  static get deltaTime(): number {
    return this._deltaTime;
  }

  static get elapsedTime(): number {
    return this._elapsedTime;
  }

  static get frameCount(): number {
    return this._frameCount;
  }
}
