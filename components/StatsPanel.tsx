'use client';

interface StatsPanelProps {
  fps: number;
  triangles?: number;
  drawCalls?: number;
}

export function StatsPanel({ fps, triangles, drawCalls }: StatsPanelProps) {
  const getFpsColor = () => {
    if (fps >= 55) return '#4ade80';
    if (fps >= 30) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 12px',
        borderRadius: '8px',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 100,
        minWidth: '100px',
      }}
    >
      <div style={{ color: getFpsColor(), fontWeight: 'bold' }}>
        {fps} FPS
      </div>
      {triangles !== undefined && (
        <div style={{ marginTop: '4px', opacity: 0.8 }}>
          {(triangles / 1000).toFixed(1)}k tris
        </div>
      )}
      {drawCalls !== undefined && (
        <div style={{ opacity: 0.8 }}>{drawCalls} calls</div>
      )}
    </div>
  );
}
