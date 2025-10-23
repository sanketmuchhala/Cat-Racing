import Link from 'next/link';

export default function Home() {
  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'monospace',
      }}
    >
      <h1
        style={{
          fontSize: '64px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        CatRoads
      </h1>
      <p
        style={{
          fontSize: '20px',
          marginBottom: '40px',
          opacity: 0.9,
        }}
      >
        Infinite Procedural Driving Experience
      </p>
      <Link
        href="/game"
        style={{
          padding: '15px 40px',
          fontSize: '20px',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid white',
          borderRadius: '50px',
          color: 'white',
          textDecoration: 'none',
          transition: 'all 0.3s',
          cursor: 'pointer',
        }}
      >
        Start Driving
      </Link>
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          fontSize: '14px',
          opacity: 0.6,
        }}
      >
        Phase 1: Core Engine Testing
      </div>
    </main>
  );
}
