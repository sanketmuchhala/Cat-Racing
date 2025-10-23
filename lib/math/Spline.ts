import * as THREE from 'three';

/**
 * Spline utilities for road generation
 */
export interface SplinePoint {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  distance: number;
}

export class Spline {
  private points: THREE.Vector3[] = [];
  private curve: THREE.CatmullRomCurve3 | null = null;
  private totalLength = 0;

  constructor(points?: THREE.Vector3[]) {
    if (points) {
      this.setPoints(points);
    }
  }

  setPoints(points: THREE.Vector3[]): void {
    this.points = points;
    if (points.length >= 2) {
      this.curve = new THREE.CatmullRomCurve3(points);
      this.totalLength = this.curve.getLength();
    }
  }

  addPoint(point: THREE.Vector3): void {
    this.points.push(point);
    if (this.points.length >= 2) {
      this.curve = new THREE.CatmullRomCurve3(this.points);
      this.totalLength = this.curve.getLength();
    }
  }

  getPoint(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3();
    return this.curve.getPoint(t);
  }

  getTangent(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3(0, 0, 1);
    return this.curve.getTangent(t).normalize();
  }

  getPointAt(distance: number): THREE.Vector3 {
    if (!this.curve || this.totalLength === 0) return new THREE.Vector3();
    const t = distance / this.totalLength;
    return this.curve.getPoint(t);
  }

  getFrameAt(distance: number): SplinePoint {
    if (!this.curve || this.totalLength === 0) {
      return {
        position: new THREE.Vector3(),
        tangent: new THREE.Vector3(0, 0, 1),
        normal: new THREE.Vector3(0, 1, 0),
        binormal: new THREE.Vector3(1, 0, 0),
        distance: 0,
      };
    }

    const t = distance / this.totalLength;
    const position = this.curve.getPoint(t);
    const tangent = this.curve.getTangent(t).normalize();

    // Calculate normal (up vector)
    const normal = new THREE.Vector3(0, 1, 0);

    // Calculate binormal (right vector)
    const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    // Recalculate normal to ensure orthogonality
    normal.crossVectors(tangent, binormal).normalize();

    return {
      position,
      tangent,
      normal,
      binormal,
      distance,
    };
  }

  getLength(): number {
    return this.totalLength;
  }

  getPoints(): THREE.Vector3[] {
    return this.points;
  }

  /**
   * Calculate banking angle based on curvature
   */
  getBankingAngle(t: number, maxBank = Math.PI / 6): number {
    if (!this.curve || this.points.length < 3) return 0;

    const dt = 0.01;
    const t1 = Math.max(0, t - dt);
    const t2 = Math.min(1, t + dt);

    const p1 = this.curve.getPoint(t1);
    const p2 = this.curve.getPoint(t2);

    const tangent1 = this.curve.getTangent(t1);
    const tangent2 = this.curve.getTangent(t2);

    // Calculate curvature approximation
    const curvature = tangent2.clone().sub(tangent1).length() / p2.distanceTo(p1);

    // Bank proportional to curvature
    const bank = THREE.MathUtils.clamp(curvature * 5, -maxBank, maxBank);
    return bank;
  }
}
