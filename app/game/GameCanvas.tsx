'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Engine } from '@/lib/engine/Engine';
import { SkyShader } from '@/lib/world/SkyShader';
import { Road } from '@/lib/world/Road';
import { Terrain } from '@/lib/world/Terrain';
import { Water } from '@/lib/world/Water';
import { RoadRailings } from '@/lib/world/RoadRailings';
import { Trees } from '@/lib/world/Trees';
import { Rocks } from '@/lib/world/Rocks';
import { Traffic } from '@/lib/world/Traffic';
import { Palette, Season, Mood } from '@/lib/world/Palette';
import { Car } from '@/lib/vehicle/Car';
import { Cat } from '@/lib/vehicle/Cat';
import { Minimap } from '@/components/Minimap';

interface GameCanvasProps {
  onEngineReady?: (engine: Engine) => void;
}

export function GameCanvas({ onEngineReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [fps, setFps] = useState(0);
  const [carPosition, setCarPosition] = useState(new THREE.Vector3());
  const [carForward, setCarForward] = useState(new THREE.Vector3(0, 0, 1));
  const [roadSegments, setRoadSegments] = useState<Array<{ center: THREE.Vector3 }>>([]);
  const [trafficCars, setTrafficCars] = useState<Array<{ position: THREE.Vector3 }>>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize engine
    const engine = new Engine({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });

    engineRef.current = engine;

    // Get initial palette (Spring + Chill for realistic green landscape)
    const palette = Palette.get(Season.SPRING, Mood.CHILL);

    // Create sky
    const sky = new SkyShader();
    engine.sceneGraph.add(sky.getMesh());

    // Create road
    const road = new Road();
    engine.sceneGraph.add(road.getMesh());

    // Update road colors
    road.updateColors(palette.roadColor, palette.roadLineColor);

    // Create terrain
    const terrain = new Terrain();
    terrain.updateColors(palette.terrainColor, palette.terrainColor2);
    engine.sceneGraph.add(terrain.getGroup());

    // Create water (lakes at lower elevation)
    const water = new Water(500);
    water.updateColor(palette.waterColor);
    water.setPosition(-2); // Match terrain water level
    engine.sceneGraph.add(water.getMesh());

    // Create road railings
    const railings = new RoadRailings();
    engine.sceneGraph.add(railings.getGroup());

    // Create trees for autumn landscape
    const trees = new Trees();
    engine.sceneGraph.add(trees.getGroup());

    // Create rocks for landscape variety
    const rocks = new Rocks();
    engine.sceneGraph.add(rocks.getGroup());

    // Traffic disabled per user request
    // const traffic = new Traffic();
    // engine.sceneGraph.add(traffic.getGroup());

    // Create car
    const car = new Car({
      maxSpeed: 60,
      acceleration: 20,
      turnSpeed: 2.5,
    });
    // Start car at proper height on road (elevated to match road)
    car.setPosition(new THREE.Vector3(0, 0.55, 0));
    engine.sceneGraph.add(car.getGroup());

    // Create cat (passenger)
    const cat = new Cat();
    car.getGroup().add(cat.getGroup());

    // Update loop
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let lastCameraSwitch = 0;
    let lastTerrainUpdate = 0;
    let lastTreeUpdate = 0;
    let lastRockUpdate = 0;

    engine.onUpdate((dt) => {
      // Get input
      const throttle = engine.input.isKeyPressed('w') || engine.input.isKeyPressed('arrowup') ? 1 : 0;
      const brake = engine.input.isKeyPressed('s') || engine.input.isKeyPressed('arrowdown') ? 1 : 0;
      let steering = 0;
      if (engine.input.isKeyPressed('a') || engine.input.isKeyPressed('arrowleft')) {
        steering = -1; // Turn left
      } else if (engine.input.isKeyPressed('d') || engine.input.isKeyPressed('arrowright')) {
        steering = 1; // Turn right
      }

      // Update car physics
      car.update(dt, throttle, steering, brake);

      // Update cat animations
      cat.update(dt, car.getSpeed());

      // Camera switching (debounced)
      if (engine.input.isKeyPressed('c') && performance.now() - lastCameraSwitch > 500) {
        engine.cameraRig.cycleMode();
        lastCameraSwitch = performance.now();
      }

      // Update road
      road.extend(car.getPosition().z);
      road.update(dt);

      // Update railings
      railings.update(car.getPosition().z);

      // Update terrain around camera (throttled for stability)
      const now = performance.now();
      if (now - lastTerrainUpdate > 500) { // Every 500ms
        terrain.update(car.getPosition().x, car.getPosition().z);
        lastTerrainUpdate = now;
      }

      // Update trees (throttled for stability)
      if (now - lastTreeUpdate > 300) { // Every 300ms
        trees.update(car.getPosition().x, car.getPosition().z);
        lastTreeUpdate = now;
      }

      // Update rocks (throttled for stability)
      if (now - lastRockUpdate > 300) { // Every 300ms
        rocks.update(car.getPosition().x, car.getPosition().z);
        lastRockUpdate = now;
      }

      // Traffic disabled
      // traffic.update(dt, car.getPosition().z, car.getSpeed());

      // Update water
      water.updatePosition(car.getPosition().x, car.getPosition().z);
      water.update(dt);

      // Update sky
      sky.updatePosition(car.getPosition()); // Keep sky centered on camera
      sky.update(
        palette.skyTop,
        palette.skyHorizon,
        palette.sunColor,
        palette.timeOfDay
      );

      // Update lighting
      const sunDir = sky.getSunDirection();
      engine.sceneGraph.updateLighting(
        sunDir,
        palette.sunColor,
        palette.ambientColor,
        palette.skyTop,
        palette.groundColor
      );
      engine.sceneGraph.updateFog(palette.fogColor, palette.fogDensity);

      // Update camera to follow car
      engine.cameraRig.update(
        dt,
        car.getPosition(),
        car.getForward(),
        car.getSpeed() * 3.6
      );

      // Update FPS counter
      frameCount++;
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Update minimap data (throttled)
      if (frameCount % 3 === 0) {
        setCarPosition(car.getPosition().clone());
        setCarForward(car.getForward().clone());
        // Get road segments for minimap (sample every 5th for performance)
        const segments = road.getSegments().filter((_, i) => i % 5 === 0);
        setRoadSegments(segments);
        // Traffic disabled
        // setTrafficCars(traffic.getCars());
      }
    });

    // Start engine
    engine.start();

    // Notify parent
    onEngineReady?.(engine);

    // Cleanup
    return () => {
      engine.dispose();
      sky.dispose();
      road.dispose();
      terrain.dispose();
      water.dispose();
      railings.dispose();
      trees.dispose();
      rocks.dispose();
      // traffic.dispose();
      car.dispose();
      cat.dispose();
    };
  }, [onEngineReady]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '14px',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '10px',
          borderRadius: '4px',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <div>CatRoads</div>
        <div>FPS: {fps}</div>
      </div>
      <Minimap
        carPosition={carPosition}
        carForward={carForward}
        roadSegments={roadSegments}
        trafficCars={trafficCars}
      />
    </>
  );
}
