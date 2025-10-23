import * as THREE from 'three';
import { Spline } from '../math/Spline';
import { Noise } from '../math/Noise';
import { createRoadMaterial } from './RoadShader';

/**
 * Infinite procedural road generation
 */
export interface RoadSegment {
  center: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  bank: number;
  width: number;
  distance: number;
}

export class Road {
  private spline: Spline;
  private segments: RoadSegment[] = [];
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private noise: Noise;

  private readonly segmentLength = 5;
  private readonly roadWidth = 8;
  private readonly maxSegments = 256;
  private totalDistance = 0;

  constructor() {
    this.noise = new Noise();
    this.material = createRoadMaterial();

    // Initialize spline with straight road
    const initialPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 20; i++) {
      initialPoints.push(new THREE.Vector3(0, 0, i * this.segmentLength));
    }
    this.spline = new Spline(initialPoints);

    // Create mesh
    const geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.receiveShadow = true;

    // Generate initial segments
    this.generateInitialSegments();
    this.updateGeometry();
  }

  private generateInitialSegments(): void {
    for (let i = 0; i < this.maxSegments; i++) {
      const distance = i * this.segmentLength;
      const t = distance / (this.maxSegments * this.segmentLength);
      const frame = this.spline.getFrameAt(distance);

      this.segments.push({
        center: frame.position,
        tangent: frame.tangent,
        normal: frame.normal,
        binormal: frame.binormal,
        bank: this.spline.getBankingAngle(t),
        width: this.roadWidth,
        distance,
      });
    }
  }

  private updateGeometry(): void {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];

      // Calculate road vertices (left and right edges)
      const halfWidth = seg.width * 0.5;
      const bankRotation = new THREE.Quaternion().setFromAxisAngle(
        seg.tangent,
        seg.bank
      );
      const rightVec = seg.binormal.clone().applyQuaternion(bankRotation);
      const upVec = seg.normal.clone().applyQuaternion(bankRotation);

      const left = seg.center.clone().sub(rightVec.clone().multiplyScalar(halfWidth));
      const right = seg.center.clone().add(rightVec.clone().multiplyScalar(halfWidth));

      // Positions
      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);

      // Normals
      normals.push(upVec.x, upVec.y, upVec.z);
      normals.push(upVec.x, upVec.y, upVec.z);

      // UVs
      const u = i / this.segments.length;
      uvs.push(0, u);
      uvs.push(1, u);

      // Indices
      if (i < this.segments.length - 1) {
        const idx = i * 2;
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }

    // Update geometry
    const geometry = this.mesh.geometry as THREE.BufferGeometry;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
  }

  extend(playerZ: number): void {
    // Add new segments ahead of the player
    const lastSeg = this.segments[this.segments.length - 1];
    const distanceAhead = lastSeg.distance - playerZ;

    if (distanceAhead < this.maxSegments * this.segmentLength * 0.5) {
      // Generate new control point for spline
      const lastPoint = this.spline.getPoints()[this.spline.getPoints().length - 1];
      const noise = this.noise.get2D(this.totalDistance * 0.01, 0);
      const curvature = noise * 15; // Curve left/right

      const newPoint = lastPoint
        .clone()
        .add(new THREE.Vector3(curvature, 0, this.segmentLength * 2));

      this.spline.addPoint(newPoint);
      this.totalDistance += this.segmentLength * 2;

      // Remove old segments
      if (this.segments.length >= this.maxSegments) {
        this.segments.shift();
      }

      // Add new segment
      const distance = lastSeg.distance + this.segmentLength;
      const t =
        distance / (this.spline.getLength() || this.maxSegments * this.segmentLength);
      const frame = this.spline.getFrameAt(distance);

      this.segments.push({
        center: frame.position,
        tangent: frame.tangent,
        normal: frame.normal,
        binormal: frame.binormal,
        bank: this.spline.getBankingAngle(t),
        width: this.roadWidth,
        distance,
      });

      this.updateGeometry();
    }
  }

  update(dt: number): void {
    this.material.uniforms.uTime.value += dt;
  }

  updateColors(roadColor: THREE.Color, lineColor: THREE.Color): void {
    this.material.uniforms.uRoadColor.value.copy(roadColor);
    this.material.uniforms.uLineColor.value.copy(lineColor);
  }

  setWetness(wetness: number): void {
    this.material.uniforms.uWetness.value = wetness;
  }

  setSnowAmount(amount: number): void {
    this.material.uniforms.uSnowAmount.value = amount;
  }

  getSegmentAt(distance: number): RoadSegment | null {
    const idx = Math.floor(distance / this.segmentLength) % this.segments.length;
    return this.segments[idx] || null;
  }

  getMesh(): THREE.Mesh {
    return this.mesh;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
