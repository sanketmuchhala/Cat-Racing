/**
 * Object pooling for performance optimization
 */
export class Pool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;

    // Pre-allocate initial pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  releaseAll(objects: T[]): void {
    objects.forEach((obj) => this.release(obj));
  }

  clear(): void {
    this.pool = [];
  }

  getSize(): number {
    return this.pool.length;
  }
}
