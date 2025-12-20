import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

import { BreathingSphere } from './components/BreathingSphere';
import { GridFloor } from './components/GridFloor';
import { ProgressRing } from './components/ProgressRing';
import { SimpleParticles } from './components/SimpleParticles';
import { GameLogic } from './components/GameLogic';
import { COLORS, CONFIG } from './config';

const App: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isStill, setIsStill] = useState(false);
  const [isAscended, setIsAscended] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = () => {
    if (isAscended || !hasStarted) return;
    setIsStill(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsStill(true), CONFIG.STILLNESS_DELAY * 1000);
  };

  useEffect(() => {
    if (hasStarted) handleMouseMove();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [hasStarted, isAscended]);

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{ width: '100vw', height: '100vh', background: COLORS.bg, position: 'relative', overflow: 'hidden' }}
    >
      {/* Start Screen Overlay */}
      {!hasStarted && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 100, background: 'rgba(5,5,16,0.9)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          fontFamily: 'sans-serif', color: 'white', textAlign: 'center'
        }}>
          <h1 style={{ fontWeight: 100, letterSpacing: '8px', fontSize: '2.5rem', marginBottom: '30px' }}>OPEN MEDITATION</h1>
          <button 
            onClick={() => setHasStarted(true)}
            style={{
              background: 'none', border: '1px solid white', color: 'white',
              padding: '12px 30px', fontSize: '0.9rem', letterSpacing: '4px',
              cursor: 'pointer', outline: 'none'
            }}
          >
            BEGIN
          </button>
        </div>
      )}

      {/* UI Overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        color: 'white', fontFamily: 'sans-serif', opacity: hasStarted ? 1 : 0, transition: 'opacity 1s'
      }}>
        <h1 style={{ fontWeight: 100, letterSpacing: '4px', textTransform: 'uppercase', margin: 0 }}>
           {isAscended ? "Ascended" : (isStill ? "Focus..." : "Find Stillness")}
        </h1>
        <div style={{ width: '200px', height: '2px', background: '#333', marginTop: '20px' }}>
            <div style={{ 
                width: `${progress * 100}%`, 
                height: '100%', 
                background: isAscended ? 'white' : COLORS.gold,
                transition: 'width 0.1s linear'
            }} />
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 2]}>
        <color attach="background" args={[COLORS.bg]} />
        <fog attach="fog" args={[COLORS.bg, 5, 25]} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color={COLORS.blue} />
        <pointLight position={[-10, -10, -10]} intensity={1} color={COLORS.gold} />

        <BreathingSphere isStill={isStill} isAscended={isAscended} />
        <ProgressRing progress={progress} isAscended={isAscended} />
        <SimpleParticles isAscended={isAscended} />
        <GridFloor />

        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />
        
        {hasStarted && (
          <GameLogic 
            isStill={isStill} 
            isAscended={isAscended} 
            setProgress={setProgress} 
            setIsAscended={setIsAscended} 
          />
        )}
        
        <OrbitControls enablePan={false} autoRotate={isAscended} autoRotateSpeed={2.0} />
      </Canvas>
    </div>
  );
}

export default App;
