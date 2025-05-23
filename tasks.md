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
- [x] Update `README.md` with Netlify deployment instructions.
- [x] Make map full page.
- [x] Implement dark mode for the map.
- [x] Implement camera follow for the character.
- [x] Change items to be Google Maps Markers.
- [x] Refine HUD: Clear "POOPLORD" logo and score, overlaid on map.
- [x] Ensure map and movement are working correctly.
- [x] Make item emojis appear correctly (no default pin, larger size).
- [ ] Implement item movement along roads using Google Maps Directions Service.
- [x] Add button to toggle background music.
- [x] Add button to toggle game sounds (fart sounds, speech synthesis).
- [x] Ensure audio works on mobile after user interaction with new buttons.
- [x] Change map to satellite view.
- [x] Change map to hybrid view (satellite with labels).
- [x] Update sound toggle buttons to use icons and ensure functionality.
- [x] Move sound toggle buttons to the bottom of the screen.
- [x] Add a 50% transparent brown multiply overlay to the map.

**Phase 4: AI Pooplords & Advanced Gameplay**
- [x] Track number of "person" items exploded by the player.
- [x] Spawn an AI Pooplord for every 5 "person" items exploded.
- [x] AI Pooplords should be visually similar to the main character (or slightly distinct if possible).
- [x] AI Pooplords autonomously move towards "person" items.
- [x] AI Pooplords "explode" "person" items on collision, adding to player's score.
- [x] AI Pooplords find new "person" targets after exploding one.

**Phase 5: DeepSeek Reflections & Enhanced Audio**
- [x] Create server endpoint to call DeepSeek API with eaten items.
- [x] Craft prompt for DeepSeek to generate Pooplord's reflective paragraph with poop/bathroom metaphors. (Revised for introspective/existential tone)
- [x] Client-side: Track recently eaten items.
- [x] Client-side: Implement a timer (approx. 1 min) to trigger reflection requests.
- [x] Client-side: Fetch reflection from server and speak using Web Speech API.
- [ ] Ensure Web Speech API works reasonably across desktop, iOS, and Android for timed events. (Requires testing)
  - [x] Attempt to prime/unlock Web Speech API on iOS via initial user interaction with SFX toggle.

**Mobile Speech Fallback (Thought Bubble):**
    - [x] Add HTML for a hidden thought bubble notification.
    - [x] Style the thought bubble.
    - [x] On mobile, show thought bubble with a "Hear Thoughts?" button instead of auto-playing speech.
    - [x] Clicking the button plays the reflection and hides the bubble.
    - [x] Ensure `recentlyEatenItems` is cleared appropriately for both desktop (auto-speak) and mobile (button-triggered speak).

**Mushroom Item & Cosmic Reflections:**
- [x] Define mushroom item (🍄) with high point value (e.g., 100x standard).
- [x] Implement special DeepSeek prompt for mushroom consumption (secrets of the universe, conspiracy theories).
- [x] Add 5-second spin and color change animation for mushroom consumption.

**Phase 6: Special Effects Items & Enhanced Chaos**
- [x] **UFO Item (🛸):**
    - [x] Add UFO emoji item worth 500 points.
    - [x] Implement teleportation effect that moves character to opposite side of globe.
    - [x] Add green glowing UFO animation effect.
    - [x] Create paranoid/conspiratorial reflection prompts for UFO consumption.
- [x] **Monkey Item (🐒):**
    - [x] Add monkey emoji item worth 300 points.
    - [x] Implement erratic movement effect that makes map shake and move randomly.
    - [x] Add wild spinning monkey animation effect.
    - [x] Create silly/hyperactive reflection prompts for monkey consumption.
- [x] **Money Item (💸):**
    - [x] Add money with wings emoji item worth 1,000,000 points.
    - [x] Add golden bling animation effect.
    - [x] Create materialistic/wealth-obsessed reflection prompts for money consumption.
- [x] **Enhanced Reflection System:**
    - [x] Make general reflections more unhinged, random, and chaotic.
    - [x] Add stream-of-consciousness style with bizarre logical leaps.
    - [x] Implement specific reflection types for each special item.
    - [x] Change from time-based (60 seconds) to item-count-based (every 10 items) reflections.
    - [x] Optimize reflection requests to send only last 5 items to avoid timeout issues.

**Phase 7: Mobile UI Optimization & Bug Fixes**
- [x] **Mobile UI:**
    - [x] Optimize HUD, logo, score, and sound controls for mobile devices.
    - [x] Make UI elements more compact but still visible on mobile.
- [x] **Audio/Speech Fixes:**
    - [x] Improve audio and speech synthesis initialization.
    - [x] Add proper audio context unlocking for browser restrictions.
    - [x] Add user interaction detection for reliable audio/speech startup.
- [x] **Reflection System Improvements:**
    - [x] Switch from timer-based to item-count-based reflections (every 10 items).
    - [x] Limit items sent to DeepSeek API to last 5 items to prevent timeouts.
    - [x] Address 502 Bad Gateway errors from Netlify function timeouts.

### Later / Optional
*   Consider leaderboard alternatives if desired.
*   Advanced item behaviors (e.g., fleeing, chasing).
*   Power-ups with temporary special abilities.
*   Different map themes/styles.
*   Achievements or challenges.
*   Multiplayer mode (very complex).
- [ ] **Mobile Speech Fallback (Thought Bubble):**
    - [ ] Add HTML for a hidden thought bubble notification.
    - [ ] Style the thought bubble.
    - [ ] On mobile, show thought bubble with a "Hear Thoughts?" button instead of auto-playing speech.
    - [ ] Clicking the button plays the reflection and hides the bubble.
    - [ ] Ensure `recentlyEatenItems` is cleared appropriately for both desktop (auto-speak) and mobile (button-triggered speak). 