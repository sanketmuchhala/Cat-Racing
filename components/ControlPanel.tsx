'use client';

import { Season, Mood } from '@/lib/world/Palette';
import { useState, useEffect } from 'react';

interface ControlPanelProps {
  season: Season;
  mood: Mood;
  trafficEnabled: boolean;
  weatherEnabled: boolean;
  bloomEnabled: boolean;
  lowPowerMode: boolean;
  onSeasonChange: (season: Season) => void;
  onMoodChange: (mood: Mood) => void;
  onTrafficToggle: (enabled: boolean) => void;
  onWeatherToggle: (enabled: boolean) => void;
  onBloomToggle: (enabled: boolean) => void;
  onLowPowerToggle: (enabled: boolean) => void;
}

export function ControlPanel({
  season,
  mood,
  trafficEnabled,
  weatherEnabled,
  bloomEnabled,
  lowPowerMode,
  onSeasonChange,
  onMoodChange,
  onTrafficToggle,
  onWeatherToggle,
  onBloomToggle,
  onLowPowerToggle,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: 20,
          right: isOpen ? 270 : 20,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          padding: '10px 15px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 200,
          transition: 'right 0.3s',
        }}
      >
        {isOpen ? '✕' : '⚙'}
      </button>

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : -300,
          width: '250px',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '80px 20px 20px 20px',
          fontFamily: 'monospace',
          fontSize: '13px',
          overflowY: 'auto',
          transition: 'right 0.3s',
          zIndex: 150,
          borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Settings</h3>

        {/* Season */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', opacity: 0.8 }}>
            Season
          </label>
          <select
            value={season}
            onChange={(e) => onSeasonChange(e.target.value as Season)}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            <option value={Season.SPRING}>Spring</option>
            <option value={Season.SUMMER}>Summer</option>
            <option value={Season.AUTUMN}>Autumn</option>
            <option value={Season.WINTER}>Winter</option>
          </select>
        </div>

        {/* Mood */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', opacity: 0.8 }}>
            Mood
          </label>
          <select
            value={mood}
            onChange={(e) => onMoodChange(e.target.value as Mood)}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            <option value={Mood.CHILL}>Chill</option>
            <option value={Mood.SUNSET_GLOW}>Sunset Glow</option>
            <option value={Mood.NIGHT_DRIVE}>Night Drive</option>
            <option value={Mood.STORMY}>Stormy</option>
            <option value={Mood.VIBESCAPE}>Vibescape</option>
          </select>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.2)', margin: '20px 0' }} />

        {/* Toggles */}
        <Toggle
          label="Traffic"
          checked={trafficEnabled}
          onChange={onTrafficToggle}
        />
        <Toggle
          label="Weather"
          checked={weatherEnabled}
          onChange={onWeatherToggle}
        />
        <Toggle
          label="Bloom"
          checked={bloomEnabled}
          onChange={onBloomToggle}
        />
        <Toggle
          label="Low Power Mode"
          checked={lowPowerMode}
          onChange={onLowPowerToggle}
        />
      </div>
    </>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
      }}
    >
      <span style={{ opacity: 0.8 }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '50px',
          height: '26px',
          background: checked ? '#4ade80' : 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '13px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            background: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '3px',
            left: checked ? '27px' : '3px',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );
}
