// components/game/FoodItem.tsx
import React from 'react';

interface FoodItemProps {
  // TODO: Define props for position, type of food, etc.
  emoji: string; // e.g., 🍎, 🍔, 🍕
}

const FoodItem: React.FC<FoodItemProps> = ({ emoji }) => {
  // Representation of a food item
  // TODO: Style for positioning on the map
  return (
    <div style={{ fontSize: '1.5rem', position: 'absolute' /* Will be positioned by game logic */ }}>
      <span>{emoji}</span>
    </div>
  );
};

export default FoodItem;