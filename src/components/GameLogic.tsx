import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CONFIG } from '../config';

interface GameLogicProps {
  isStill: boolean;
  isAscended: boolean;
  setProgress: (v: number) => void;
  setIsAscended: (v: boolean) => void;
}

export const GameLogic: React.FC<GameLogicProps> = ({ isStill, isAscended, setProgress, setIsAscended }) => {
  const timeElapsed = useRef(0);

  useFrame((_state, delta) => {
    if (!isStill || isAscended) return;
    
    timeElapsed.current += delta;
    const p = Math.min(1, timeElapsed.current / CONFIG.SECONDS_TO_ASCEND);
    setProgress(p);
    
    if (p >= 1) {
        setIsAscended(true);
    }
  });
  
  return null;
};
