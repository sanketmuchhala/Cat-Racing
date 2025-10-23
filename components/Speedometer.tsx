'use client';

interface SpeedometerProps {
  speed: number; // km/h
}

export function Speedometer({ speed }: SpeedometerProps) {
  const maxSpeed = 200;
  const speedPercent = Math.min((speed / maxSpeed) * 100, 100);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontFamily: 'monospace',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: '36px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        }}
      >
        {Math.round(speed)}
        <span style={{ fontSize: '18px', marginLeft: '5px' }}>km/h</span>
      </div>
      <div
        style={{
          width: '200px',
          height: '6px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            width: `${speedPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4ade80, #fbbf24, #ef4444)',
            transition: 'width 0.1s',
          }}
        />
      </div>
    </div>
  );
}
