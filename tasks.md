# Pooplord - Task List

**Phase 1: Core Game Mechanics & Setup**
- [X] **Project Setup:**
    - [X] Set up a basic HTML, CSS, and JavaScript project structure.
    - [X] Create `tasks.md`.
- [X] **Character:**
    - [X] Display the Pooplord character (poop emoji) on the screen.
    - [X] Implement character movement with cursor keys (desktop).
    - [X] Implement character movement with touch drag (mobile).
- [X] **Map:**
    - [X] Integrate Google Maps API.
    - [X] Overlay the game on the user's local area.
- [X] **Items (Food & Non-Edibles):**
    - [X] Create and display food items on the map.
    - [X] Create and display non-edible items on the map.
    - [ ] Implement item movement (walking around).
    - [X] Implement item respawning.
- [X] **Interaction (Eating/Collision):**
    - [X] Detect collision between Pooplord and items.
    - [X] Implement logic for eating food items:
        - [X] Increase character size (REMOVED - only people/bombs affect size).
        - [X] Increase character speed (REMOVED - keeping it simple for now).
        - [X] Increase character strength (REMOVED - keeping it simple for now).
        - [X] Add points to score.
        - [X] Add "brown explosion" visual effect.
    - [X] Implement logic for colliding with non-edible items:
        - [X] Decrease character size (MODIFIED - only bombs decrease size).
        - [X] Decrease character speed (REMOVED - keeping it simple for now).
        - [X] Decrease character strength (REMOVED - keeping it simple for now).
        - [X] Subtract points from score.
        - [X] Add "brown explosion" visual effect.
    - [X] Add "People" items:
        - [X] Display various people emojis.
        - [X] On collision: "brown explosion", increase character size, award points.
- [X] **Scoring:**
    - [X] Display the current score.

**Phase 2: Enhancements & Polish**
- [X] **Animations:**
    - [X] Add animations for character movement.
    - [X] Add animations for eating.
    - [X] Add animations for item interactions (e.g., bomb exploding).
- [X] **Visuals & UI:**
    - [X] Refine the visual appearance of the game.
    - [X] Improve UI elements (score display, game messages).

**Phase 3: Advanced Features (Future Considerations)**
- [ ] **Game Balance:**
    - [ ] Adjust spawn rates, item effects, character speed/size changes.
- [ ] **Levels/Progression:**
    - [ ] Introduce different levels or increasing difficulty.
- [ ] **Power-ups:**
    - [ ] Special items that give temporary boosts or abilities.
- [X] **Leaderboards:**
    - [X] Allow players to compete for high scores.

**Project Infrastructure**
- [X] **Environment Variables:**
    - [X] Set up server to load Google Maps API key from .env file
    - [X] Create package.json with necessary dependencies
- [x] Make items appear as map markers (emojis) without default pin, increased emoji size.
- [x] Load Google Maps `directions` library.
- [x] Implement item movement along roads using `DirectionsService`. (DEPRIORITIZED - items will have simpler movement for now)
- [ ] Refine item spawning to be on or near roads.
- [ ] Ensure collision detection works with moving items.
- [ ] Add sound effects for eating, getting hurt, and game events.
- [ ] Polish UI/UX further (e.g., game over screen, restart button).
- [ ] Consider adding different types of food/hazards with more varied effects.
- [ ] Explore adding "enemy" AI poops or other challenges. 