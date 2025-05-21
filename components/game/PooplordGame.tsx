// components/game/PooplordGame.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameMap from './GameMap';
import Character from './Character';
import GameItem from './GameItem';
import { useGameLogic, GameItemType } from './useGameLogic';

// IMPORTANT: Replace with your actual API key, ideally from an environment variable
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; 

const PooplordGame = () => {
  const { gameState, moveCharacter, setCharacterPosition, setMapContext } = useGameLogic();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // google.maps.Map
  const [mapLoaded, setMapLoaded] = useState(false);

  const touchStateRef = useRef<{ startX: number; startY: number; charStartX: number; charStartY: number; isDragging: boolean; } | null>(null);

  const handleMapLoaded = useCallback((map: any /* google.maps.Map */) => {
    mapInstanceRef.current = map;
    setMapLoaded(true);
    if (gameAreaRef.current) {
        // Pass map and container to game logic for coordinate conversions
        setMapContext(map, gameAreaRef.current);
    }
    console.log("Map loaded and context set in game logic.");
  }, [setMapContext]); // setMapContext will be added to useGameLogic

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!mapLoaded) return; // Don't allow movement before map is ready
      let dx = 0; 
      let dy = 0;
      switch (event.key) {
        case 'ArrowUp': dy = -1; break;
        case 'ArrowDown': dy = 1; break;
        case 'ArrowLeft': dx = -1; break;
        case 'ArrowRight': dx = 1; break;
        default: return;
      }
      moveCharacter(dx, dy); // This will now work with LatLng deltas
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveCharacter, mapLoaded]);

  // Touch controls
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!mapLoaded || event.touches.length === 0) return;
    const touch = event.touches[0];
    // For touch, we need to convert screen touch to LatLng first for charStart
    // This is a placeholder; actual conversion needs map projection.
    // For now, we'll continue using pixel delta and let useGameLogic handle conversion.
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      charStartX: gameState.character.x, // This is currently pixel based, will be converted
      charStartY: gameState.character.y, // This is currently pixel based, will be converted
      isDragging: true,
    };
    event.preventDefault();
  }, [mapLoaded, gameState.character.x, gameState.character.y]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStateRef.current?.isDragging || event.touches.length === 0 || !mapInstanceRef.current) return;
    const touch = event.touches[0];
    const gameDiv = gameAreaRef.current;
    if (!gameDiv) return;

    // Calculate new desired pixel position based on drag
    const deltaX = touch.clientX - touchStateRef.current.startX;
    const deltaY = touch.clientY - touchStateRef.current.startY;
    const newPixelX = touchStateRef.current.charStartX + deltaX;
    const newPixelY = touchStateRef.current.charStartY + deltaY;

    // Convert this new pixel position to LatLng
    // This requires the map's projection. For simplicity in this step,
    // we'll pass pixels to setCharacterPosition and let it handle conversion if needed.
    // A more robust way is to convert to LatLng here.
    setCharacterPosition(newPixelX, newPixelY); // This will accept pixels and convert internally
    event.preventDefault();
  }, [setCharacterPosition]);

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current = null;
  }, []);

  if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return <div style={{padding: 20, color: 'red', textAlign: 'center'}}>Error: Google Maps API Key is not configured in PooplordGame.tsx.</div>;
  }

  return (
    <div 
      ref={gameAreaRef}
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', userSelect: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <GameMap onMapLoaded={handleMapLoaded} apiKey={GOOGLE_MAPS_API_KEY} />
      
      {mapLoaded && (
        <>
          <Character 
            x={gameState.character.renderX ?? 0} // renderX/Y will be new pixel coords from logic
            y={gameState.character.renderY ?? 0}
            size={gameState.character.size} 
          />
          {gameState.items.map((item: GameItemType) => (
            <GameItem 
              key={item.id} 
              x={item.renderX ?? 0} // renderX/Y for items
              y={item.renderY ?? 0}
              emoji={item.emoji} 
              status={item.status}
            />
          ))}
        </>
      )}

      <div style={{
        position: 'absolute', top: 10, left: 10, 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        padding: '10px', borderRadius: '5px', zIndex: 1000 
      }}>
        Score: {gameState.score} | Size: {gameState.character.size.toFixed(1)} | Speed: {gameState.character.speed.toFixed(1)}
        <br/>Items: {gameState.items.filter(i => i.status === 'active').length} | Map Loaded: {mapLoaded ? 'Yes' : 'No'}
        {/* <br/> Lat: {gameState.character.lat.toFixed(4)} Lng: {gameState.character.lng.toFixed(4)} */}
      </div>
    </div>
  );
};

export default PooplordGame;
