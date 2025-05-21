// components/game/GameItem.tsx
import React from 'react';

export interface GameItemProps {
  x: number;
  y: number;
  emoji: string;
  status: 'active' | 'disappearing';
}

const GameItem: React.FC<GameItemProps> = ({ x, y, emoji, status }) => {
  const itemStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    fontSize: '1.5rem',
    userSelect: 'none',
    transition: `opacity ${300}ms ease-out, transform ${300}ms ease-out`,
    opacity: status === 'disappearing' ? 0 : 1,
    transform: status === 'disappearing' ? 'scale(0.3)' : 'scale(1)',
  };

  return (
    <div style={itemStyle}>
      <span>{emoji}</span>
    </div>
  );
};

export default GameItem;
