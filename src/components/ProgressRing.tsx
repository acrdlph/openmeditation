import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../config';

export const ProgressRing: React.FC<{ progress: number; isAscended: boolean }> = ({ progress, isAscended }) => {
  const ref = useRef<THREE.Mesh>(null!);

  const thetaLength = Math.max(0.001, progress * Math.PI * 2);

  useFrame(() => {
    if (ref.current) {
        ref.current.rotation.z -= 0.01;
        if(isAscended) {
          const s = THREE.MathUtils.lerp(ref.current.scale.x, 1.5, 0.05);
          ref.current.scale.set(s, s, s);
        }
    }
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.9, 32, 1, 0, thetaLength]} />
        <meshBasicMaterial color={isAscended ? COLORS.white : COLORS.gold} side={THREE.DoubleSide} />
    </mesh>
  );
};

