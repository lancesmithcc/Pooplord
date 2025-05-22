// components/game/useGameLogic.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Google Maps specific types (basic for now)
interface LatLngLiteral { lat: number; lng: number; }
interface MapPoint { x: number; y: number; }
interface GoogleMap { getProjection: () => any | null; getBounds: () => any | null; getZoom: () => number | undefined; getCenter: () => LatLngLiteral | undefined; }
interface MapOverlayProjection {
  fromLatLngToDivPixel: (latLng: LatLngLiteral) => MapPoint | null;
  fromDivPixelToLatLng: (pixel: MapPoint) => LatLngLiteral | null;
}

interface BaseItem {
  id: string;
  lat: number; lng: number; // Core position is LatLng
  renderX?: number; renderY?: number; // Pixel position for rendering
  emoji: string;
  dx: number; dy: number; // Movement deltas in LatLng units
  status: 'active' | 'disappearing';
}
export interface FoodItemType extends BaseItem { type: 'food'; points: number; sizeChange: number; speedChange: number; }
export interface NonEdibleItemType extends BaseItem { type: 'non-edible'; points: number; sizeChange: number; speedChange: number; }
export type GameItemType = FoodItemType | NonEdibleItemType;

interface CharacterState {
  lat: number; lng: number;
  renderX?: number; renderY?: number;
  size: number; speed: number; strength: number;
  width: number; height: number; // Pixel dimensions based on size
}

interface GameState {
  score: number;
  character: CharacterState;
  items: GameItemType[];
  map?: GoogleMap;
  gameContainer?: HTMLDivElement;
  projection?: MapOverlayProjection;
}

const REM_TO_PX = 16;
const MIN_CHAR_SIZE = 0.5; MAX_CHAR_SIZE = 5;
const MIN_CHAR_SPEED = 0.00002; MAX_CHAR_SPEED = 0.0003; // Speed in LatLng degrees
const ITEM_MAX_SPEED_LATLNG = 0.000015;
const ITEM_ANIMATION_DURATION = 300;
const ITEM_SIZE_PX = 1.5 * REM_TO_PX;

const initialCharacterState: CharacterState = {
  lat: 0, lng: 0, // Will be set by map center
  size: 2, speed: 0.00015, strength: 1,
  width: 2 * REM_TO_PX, height: 2 * REM_TO_PX,
};

const initialGameState: GameState = {
  score: 0, character: initialCharacterState, items: [],
};

const FOOD_EMOJIS = ['🍎', '🍔', '🍕', '🍗', '🥦', '🍓'];
const NON_EDIBLE_EMOJIS = ['💣', '🚬', '💊', '🌵', '🧱'];
const FOOD_EFFECT = { points: 10, sizeChange: 0.2, speedChange: 0.00002 };
const NON_EDIBLE_EFFECT = { points: -5, sizeChange: -0.15, speedChange: -0.00002 };
const ITEM_UPDATE_INTERVAL = 50;

export const useGameLogic = () => {
  const [gameState, setGameStateInternal] = useState<GameState>(initialGameState);
  const gameStateRef = useRef(gameState);
  const activeTimeouts = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { const timeouts = activeTimeouts.current; return () => { timeouts.forEach(clearTimeout); }; }, []);

  const setGameState = useCallback((updater: GameState | ((prevState: GameState) => GameState)) => {
    setGameStateInternal(prevState => {
      const nextState = typeof updater === 'function' ? updater(prevState) : updater;
      gameStateRef.current = nextState;
      return nextState;
    });
  }, []);

  const setMapContext = useCallback((map: GoogleMap, container: HTMLDivElement) => {
    const projection = map.getProjection();
    const center = map.getCenter();
    setGameState(prev => ({
      ...prev,
      map,
      gameContainer: container,
      projection,
      character: center ? { ...prev.character, lat: center.lat, lng: center.lng } : prev.character,
    }));
    // Listen for map bounds changing to update projection if necessary
    // This is a simplified listener. Real-world might need more robust handling (e.g. OverlayView)
    map.getBounds(); // Initialize listener if not already there for bounds_changed
    const listener = map.addListener('bounds_changed', () => {
        const newProjection = map.getProjection();
        if (newProjection) {
            setGameState(prevUpdate => ({...prevUpdate, projection: newProjection}));
        }
    });
    // TODO: Store and clean up this listener properly
  }, [setGameState]);

  // Helper to update renderX, renderY for character and items
  const updateRenderCoordinates = useCallback(() => {
    setGameState(prev => {
      if (!prev.projection || !prev.gameContainer) return prev;
      const { projection, character, items } = prev;
      const charPoint = projection.fromLatLngToDivPixel({ lat: character.lat, lng: character.lng });
      const updatedItems = items.map(item => {
        const itemPoint = projection.fromLatLngToDivPixel({ lat: item.lat, lng: item.lng });
        return { ...item, renderX: itemPoint?.x, renderY: itemPoint?.y };
      });
      return {
        ...prev,
        character: { ...character, renderX: charPoint?.x, renderY: charPoint?.y },
        items: updatedItems,
      };
    });
  }, [setGameState]);

  useEffect(() => {
    // Update render coordinates whenever map context or core positions change.
    // A more optimized way might be to tie this to map 'idle' or 'bounds_changed' events.
    const intervalId = setInterval(updateRenderCoordinates, 100); // Periodically update pixel positions
    activeTimeouts.current.push(intervalId);
    return () => clearInterval(intervalId);
  }, [updateRenderCoordinates]);


  const moveCharacter = useCallback((dLat: number, dLng: number) => {
    setGameState(prev => {
      if (!prev.map) return prev;
      // dLat/dLng are now multipliers for speed
      const newLat = prev.character.lat + dLat * prev.character.speed;
      const newLng = prev.character.lng + dLng * prev.character.speed;
      // TODO: Boundary checks using map.getBounds()
      return { ...prev, character: { ...prev.character, lat: newLat, lng: newLng } };
    });
  }, [setGameState]);

 const setCharacterPosition = useCallback((pixelX: number, pixelY: number) => {
    setGameState(prev => {
      if (!prev.projection) return prev;
      const latLng = prev.projection.fromDivPixelToLatLng({ x: pixelX, y: pixelY });
      if (latLng) {
        // TODO: Boundary checks for LatLng
        return { ...prev, character: { ...prev.character, lat: latLng.lat, lng: latLng.lng } };
      }
      return prev;
    });
  }, [setGameState]);

  const spawnItem = useCallback(() => {
    setGameState(prev => {
      if (!prev.map || !prev.projection || !prev.gameContainer) return prev;
      if (prev.items.filter(item => item.status === 'active').length >= 20) return prev;

      const bounds = prev.map.getBounds();
      if (!bounds) return prev;
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const lat = sw.lat() + Math.random() * (ne.lat() - sw.lat());
      const lng = sw.lng() + Math.random() * (ne.lng() - sw.lng());
      
      const dx = (Math.random() - 0.5) * 2 * ITEM_MAX_SPEED_LATLNG;
      const dy = (Math.random() - 0.5) * 2 * ITEM_MAX_SPEED_LATLNG;
      const isFood = Math.random() > 0.4;
      let newItem: GameItemType;
      if (isFood) {
        newItem = { id: uuidv4(), lat, lng, dx, dy, emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)], type: 'food', status: 'active', ...FOOD_EFFECT };
      } else {
        newItem = { id: uuidv4(), lat, lng, dx, dy, emoji: NON_EDIBLE_EMOJIS[Math.floor(Math.random() * NON_EDIBLE_EMOJIS.length)], type: 'non-edible', status: 'active', ...NON_EDIBLE_EFFECT };
      }
      return { ...prev, items: [...prev.items, newItem] };
    });
  }, [setGameState]);

  useEffect(() => {
    if (gameState.map) { // Only start spawning once map is available
        for (let i = 0; i < 10; i++) spawnItem();
        const intervalId = setInterval(spawnItem, 2500);
        activeTimeouts.current.push(intervalId);
        return () => clearInterval(intervalId);
    }
  }, [spawnItem, gameState.map]);

  // Item Movement Loop (now using LatLng)
  useEffect(() => {
    if (!gameState.map) return; // Don't move items if no map
    const itemMoveInterval = setInterval(() => {
      setGameState(prev => {
        if (!prev.map) return prev;
        const bounds = prev.map.getBounds();
        const updatedItems = prev.items.map(item => {
          if (item.status === 'disappearing') return item;
          let newLat = item.lat + item.dy; // dy for lat, dx for lng
          let newLng = item.lng + item.dx;
          let newDx = item.dx; let newDy = item.dy;

          if (bounds) {
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            if (newLat <= sw.lat() || newLat >= ne.lat()) { newDy = -newDy; newLat = Math.max(sw.lat(), Math.min(newLat, ne.lat())); }
            if (newLng <= sw.lng() || newLng >= ne.lng()) { newDx = -newDx; newLng = Math.max(sw.lng(), Math.min(newLng, ne.lng())); }
          }
          return { ...item, lat: newLat, lng: newLng, dx: newDx, dy: newDy };
        });
        return { ...prev, items: updatedItems };
      });
    }, ITEM_UPDATE_INTERVAL);
    activeTimeouts.current.push(itemMoveInterval);
    return () => clearInterval(itemMoveInterval);
  }, [setGameState, gameState.map]);

  // Collision Detection (uses renderX/renderY)
  useEffect(() => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState.projection || !currentGameState.character.renderX || !currentGameState.character.renderY) return;

    const char = currentGameState.character;
    let scoreDelta = 0; let sizeDelta = 0; let speedDelta = 0;
    let itemsToUpdate: GameItemType[] = [];
    let itemsToKeep: GameItemType[] = [];
    let collisionOccurred = false;

    currentGameState.items.forEach(item => {
      if (item.status === 'disappearing' || !item.renderX || !item.renderY) {
        itemsToKeep.push(item);
        return;
      }
      const collides = 
        char.renderX! < item.renderX + ITEM_SIZE_PX &&
        char.renderX! + char.width > item.renderX &&
        char.renderY! < item.renderY + ITEM_SIZE_PX &&
        char.renderY! + char.height > item.renderY;

      if (collides) {
        collisionOccurred = true; scoreDelta += item.points; sizeDelta += item.sizeChange; speedDelta += item.speedChange;
        itemsToUpdate.push({ ...item, status: 'disappearing' });
        const timeoutId = setTimeout(() => {
          setGameState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== item.id) }));
          activeTimeouts.current = activeTimeouts.current.filter(id => id !== timeoutId);
        }, ITEM_ANIMATION_DURATION);
        activeTimeouts.current.push(timeoutId);
      } else {
        itemsToKeep.push(item);
      }
    });

    if (collisionOccurred) {
      setGameState(prev => {
        const newSize = Math.max(MIN_CHAR_SIZE, Math.min(prev.character.size + sizeDelta, MAX_CHAR_SIZE));
        const newSpeed = Math.max(MIN_CHAR_SPEED, Math.min(prev.character.speed + speedDelta, MAX_CHAR_SPEED));
        return {
          ...prev,
          score: prev.score + scoreDelta,
          items: [...itemsToKeep, ...itemsToUpdate.filter(collidedItem => !itemsToKeep.find(ik => ik.id === collidedItem.id))],
          character: { ...prev.character, size: newSize, speed: newSpeed, width: newSize * REM_TO_PX, height: newSize * REM_TO_PX },
        };
      });
    }
  }, [
    gameState.character.renderX, gameState.character.renderY, // Trigger on pixel position change
    gameState.items, // Trigger if items array changes (e.g. for status or render coords)
    setGameState
  ]);

  return { gameState: gameStateRef.current, moveCharacter, setCharacterPosition, setMapContext };
};
