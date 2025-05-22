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
    - [X] Implement item movement (walking around).
    - [X] Implement item respawning.
- [X] **Interaction (Eating/Collision):**
    - [X] Detect collision between Pooplord and items.
    - [X] Implement logic for eating food items:
        - [X] Increase character size.
        - [X] Increase character speed.
        - [X] Increase character strength.
        - [X] Add points to score.
    - [X] Implement logic for colliding with non-edible items:
        - [X] Decrease character size.
        - [X] Decrease character speed.
        - [X] Decrease character strength.
        - [X] Subtract points from score.
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