import { createNoise2D, NoiseFunction2D } from 'simplex-noise';

/**
 * Noise utilities for terrain and procedural generation
 */
export class Noise {
  private noise2D: NoiseFunction2D;

  constructor(seed?: number) {
    this.noise2D = createNoise2D(() => seed ?? Math.random());
  }

  /**
   * Get 2D simplex noise value (-1 to 1)
   */
  get2D(x: number, y: number): number {
    return this.noise2D(x, y);
  }

  /**
   * Fractal Brownian Motion (multiple octaves)
   */
  fbm(x: number, y: number, octaves = 4, persistence = 0.5, lacunarity = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.get2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Get height value for terrain (0 to 1)
   */
  getHeight(x: number, z: number, scale = 0.05): number {
    const n = this.fbm(x * scale, z * scale, 4, 0.5, 2.0);
    return (n + 1) * 0.5; // Remap from [-1,1] to [0,1]
  }
}
