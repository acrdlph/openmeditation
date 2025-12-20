import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Icosahedron } from '@react-three/drei';
import * as THREE from 'three';
import { VisualStateProps } from '../types';
import { COLORS } from '../config';

export const BreathingSphere: React.FC<VisualStateProps> = ({ isStill, isAscended }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const breathe = Math.sin(time * 0.8); 

    // 1. Breathe Animation
    const scaleBase = isAscended ? 1.5 : 1.2;
    const scale = scaleBase + (breathe * 0.2);
    
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y += 0.005;
    }
    
    // 2. Inner Glow Pulse
    if (glowRef.current) {
        const glowScale = isAscended ? 1.2 : 0.9 + (breathe * 0.1);
        glowRef.current.scale.set(glowScale, glowScale, glowScale);
    }
  });

  const activeColor = isAscended ? COLORS.white : (isStill ? COLORS.gold : COLORS.blue);

  return (
    <group>
      {/* Main Crystal - Low Poly Style */}
      <Icosahedron args={[1, 0]} ref={meshRef}>
        <meshStandardMaterial 
            color={activeColor}
            roughness={0.2}
            metalness={0.8}
            flatShading={true}
        />
      </Icosahedron>

      {/* "Fake" Glow - Wireframe */}
      <Icosahedron args={[1.2, 1]} ref={glowRef}>
        <meshBasicMaterial 
            color={activeColor} 
            wireframe 
            transparent 
            opacity={0.3} 
        />
      </Icosahedron>
    </group>
  );
};
