'use client';

interface HUDProps {
  fps: number;
  hints?: string[];
}

export function HUD({ fps, hints }: HUDProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '10px 15px',
        borderRadius: '8px',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>CatRoads</div>
      <div>FPS: {fps}</div>
      {hints && hints.length > 0 && (
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
          {hints.map((hint, i) => (
            <div key={i}>{hint}</div>
          ))}
        </div>
      )}
    </div>
  );
}
