import React from 'react';

export const GridFloor: React.FC = () => {
  return (
    <gridHelper args={[20, 20, 0x222222, 0x111111]} position={[0, -2, 0]} />
  );
};

