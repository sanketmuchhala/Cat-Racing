'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface MinimapProps {
  carPosition: THREE.Vector3;
  carForward: THREE.Vector3;
  roadSegments: Array<{ center: THREE.Vector3 }>;
  trafficCars?: Array<{ position: THREE.Vector3; lane: number; direction?: number }>;
}

export function Minimap({ carPosition, carForward, roadSegments, trafficCars = [] }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200; // Canvas size in pixels
    const scale = 2 * zoom; // Meters per pixel
    const centerX = size / 2;
    const centerY = size / 2;

    function draw() {
      if (!ctx || !canvas) return;

      // Clear with dark background
      ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
      ctx.fillRect(0, 0, size, size);

      // Draw border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, size, size);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      const gridSpacing = 20; // pixels
      for (let x = 0; x < size; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
      }
      for (let y = 0; y < size; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }

      // Draw road path
      if (roadSegments.length > 0) {
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.9)'; // Dark gray for road
        ctx.lineWidth = 8; // Wider to represent road width
        ctx.beginPath();

        let first = true;
        for (const segment of roadSegments) {
          // Convert world position to minimap position
          const dx = segment.center.x - carPosition.x;
          const dz = segment.center.z - carPosition.z;

          const mapX = centerX + dx / scale;
          const mapY = centerY - dz / scale; // Flip Z for top-down view

          if (first) {
            ctx.moveTo(mapX, mapY);
            first = false;
          } else {
            ctx.lineTo(mapX, mapY);
          }
        }
        ctx.stroke();

        // Draw road center line on minimap for clarity
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Yellow centerline
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]); // Dashed line
        ctx.beginPath();
        first = true;
        for (const segment of roadSegments) {
          const dx = segment.center.x - carPosition.x;
          const dz = segment.center.z - carPosition.z;
          const mapX = centerX + dx / scale;
          const mapY = centerY - dz / scale;

          if (first) {
            ctx.moveTo(mapX, mapY);
            first = false;
          } else {
            ctx.lineTo(mapX, mapY);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Draw distance markers every 100m
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '8px monospace';
        for (const segment of roadSegments) {
          // Only draw markers at 100m intervals
          const distance = Math.round(segment.center.z);
          if (distance % 100 === 0) {
            const dx = segment.center.x - carPosition.x;
            const dz = segment.center.z - carPosition.z;
            const mapX = centerX + dx / scale;
            const mapY = centerY - dz / scale;

            // Draw marker dot
            ctx.beginPath();
            ctx.arc(mapX, mapY, 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw distance label (only if not too close to other labels)
            if (distance % 500 === 0 && mapX >= 10 && mapX <= size - 30 && mapY >= 10 && mapY <= size - 10) {
              ctx.fillText(`${(distance / 1000).toFixed(1)}km`, mapX + 5, mapY + 3);
            }
          }
        }

        // Draw road edges
        ctx.strokeStyle = 'rgba(200, 200, 0, 0.4)';
        ctx.lineWidth = 1;
        const roadWidth = 4; // Half width in meters
        ctx.beginPath();
        for (const segment of roadSegments) {
          const dx = segment.center.x - carPosition.x;
          const dz = segment.center.z - carPosition.z;
          const mapX = centerX + dx / scale;
          const mapY = centerY - dz / scale;

          // Simplified - just draw wider line
          ctx.moveTo(mapX - roadWidth / scale, mapY);
          ctx.lineTo(mapX + roadWidth / scale, mapY);
        }
        ctx.stroke();
      }

      // Draw north indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px monospace';
      ctx.fillText('N', centerX - 6, 15);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 20);
      ctx.lineTo(centerX, 30);
      ctx.stroke();

      // Draw traffic cars
      if (trafficCars && trafficCars.length > 0) {
        trafficCars.forEach((trafficCar) => {
          // Convert world position to minimap position
          const dx = trafficCar.position.x - carPosition.x;
          const dz = trafficCar.position.z - carPosition.z;

          const mapX = centerX + dx / scale;
          const mapY = centerY - dz / scale;

          // Only draw if within minimap bounds
          if (mapX >= 0 && mapX <= size && mapY >= 0 && mapY <= size) {
            // Draw traffic car as colored circle
            // Red = forward traffic (same direction), Blue = oncoming traffic
            const isOncoming = trafficCar.direction === -1;
            ctx.fillStyle = isOncoming
              ? 'rgba(100, 150, 255, 0.9)' // Blue for oncoming
              : 'rgba(255, 100, 100, 0.9)'; // Red for forward
            ctx.beginPath();
            ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }

      // Draw car (always at center)
      ctx.save();
      ctx.translate(centerX, centerY);

      // Rotate to car's heading
      const heading = Math.atan2(carForward.x, carForward.z);
      ctx.rotate(-heading);

      // Draw car triangle
      ctx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // White
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8); // Front
      ctx.lineTo(-5, 5); // Back left
      ctx.lineTo(5, 5); // Back right
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Draw zoom level
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.fillText(`${zoom.toFixed(1)}x`, 5, size - 5);

      // Draw distance traveled
      const distanceKm = (carPosition.z / 1000).toFixed(2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '11px monospace';
      ctx.fillText(`${distanceKm} km`, size - 60, size - 5);

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [carPosition, carForward, roadSegments, trafficCars, zoom]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        padding: '5px',
        zIndex: 100,
      }}
    >
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        style={{
          display: 'block',
          borderRadius: '4px',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '5px',
        }}
      >
        <button
          onClick={handleZoomOut}
          style={{
            width: '30px',
            height: '30px',
            background: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          −
        </button>
        <button
          onClick={handleZoomIn}
          style={{
            width: '30px',
            height: '30px',
            background: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
