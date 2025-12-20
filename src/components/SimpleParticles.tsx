import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { COLORS } from '../config';

export const SimpleParticles: React.FC<{ isAscended: boolean }> = ({ isAscended }) => {
  const count = 200;
  const mesh = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (mesh.current) {
        mesh.current.rotation.y += 0.001;
        if (isAscended) mesh.current.rotation.y += 0.01;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        color={isAscended ? COLORS.white : COLORS.blue} 
        transparent 
        opacity={0.6} 
        sizeAttenuation 
      />
    </points>
  );
};


