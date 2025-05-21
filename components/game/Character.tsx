// components/game/Character.tsx
import React from 'react';

interface CharacterProps {
  x: number;
  y: number;
  size: number; // e.g., in rem for font size
  // TODO: add other relevant props like character image/emoji if it changes
}

const Character: React.FC<CharacterProps> = ({ x, y, size }) => {
  return (
    <div 
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        fontSize: `${size}rem`,
        transition: 'left 0.1s linear, top 0.1s linear' // Smooth movement
      }}
    >
      <span>💩</span>
    </div>
  );
};

export default Character;