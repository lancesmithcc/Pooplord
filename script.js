console.log("Pooplord game script loaded!");

// We will add game logic here, including:
// - Google Maps integration
// - Character movement
// - Item generation and interaction
// - Scoring
// - Animations

const character = document.getElementById('character');
const gameContainer = document.getElementById('game-container');
let characterX = character.offsetLeft;
let characterY = character.offsetTop;
const characterSpeed = 10; // Pixels per move - this will now be a map pan amount
let map; // Google Map instance
let score = 0; // Player's score
let characterSize = 2; // Character size multiplier (starts at 2rem)
let directionsService;
let directionsRenderer;

// New variables for AI Pooplords
let peopleExplodedCount = 0;
const aiPooplords = [];
const AI_POOPLORD_SPAWN_THRESHOLD = 5;
const AI_POOPLORD_SPEED = 2; // Meters per update, adjust as needed
const AI_POOPLORD_TARGET_RADIUS = 5; // Radius within which AI considers target reached (meters)

// Variables for DeepSeek Reflections
let recentlyEatenItems = [];
const REFLECTION_INTERVAL = 60000; // 60 seconds

const itemSpawnInterval = 2000; // Spawn new item every 2 seconds
const itemMovementInterval = 50; // Update item positions every 50ms for smoother animation
const ITEM_WANDER_SPEED = 0.75; // Meters per movement interval (e.g., 0.75m every 50ms = 15 m/s)
const ITEM_STEPS_BEFORE_TURN = 80; // Approx. 4 seconds (80 * 50ms)
const PERSON_FRAME_CHANGE_INTERVAL = 250; // Milliseconds (4 frames per second)

// Audio elements and sound paths
let backgroundMusic;
const fartSounds = ['fart1.mp3', 'fart2.mp3', 'fart3.mp3'];
let hasUserInteracted = false; // Flag to track user interaction for music autoplay
let scoreMilestoneTracker = 0; // Tracks 500-point milestones for voice lines
const milestonePhrases = ["oh crappidy crap yeah", "cool poop my man", "super duty! fartsicles!"];

// Get score display element from the DOM
const scoreDisplay = document.getElementById('score-display');
// const gameInfo = document.getElementById('game-info'); // game-info is no longer used in JS

// Sound toggle states and button elements
let isMusicOn = true;
let areSfxOn = true;
const musicToggleButton = document.getElementById('music-toggle-btn');
const sfxToggleButton = document.getElementById('sfx-toggle-btn');

// Logic for old game-info panel (now instructions-panel, CSS handled)
/*
const hideInstructionsTimeout = setTimeout(() => {
    gameInfo.style.opacity = '0.3';
}, 5000); // Hide instructions after 5 seconds

gameInfo.addEventListener('mouseenter', () => {
    clearTimeout(hideInstructionsTimeout);
    gameInfo.style.opacity = '1';
});

gameInfo.addEventListener('mouseleave', () => {
    gameInfo.style.opacity = '0.3';
});
*/

// Update score display
function updateScore(points) {
    const oldScore = score;
    score += points;
    scoreDisplay.innerHTML = `Score: ${score}`;

    // Check for 500-point milestone
    if (score > 0) {
        const newMilestoneLevel = Math.floor(score / 500);
        if (newMilestoneLevel > scoreMilestoneTracker) {
            if (oldScore < newMilestoneLevel * 500) { // Ensure we only trigger once when crossing the threshold upwards
                const randomPhrase = milestonePhrases[Math.floor(Math.random() * milestonePhrases.length)];
                speakText(randomPhrase);
            }
            scoreMilestoneTracker = newMilestoneLevel;
        } else if (newMilestoneLevel < scoreMilestoneTracker) {
            // If score drops below a previously achieved milestone, reset the tracker
            scoreMilestoneTracker = newMilestoneLevel;
        }
    }
    
    // Visual feedback for score change
    const pointsDisplay = document.createElement('div');
    pointsDisplay.className = 'points-popup';
    pointsDisplay.textContent = points > 0 ? `+${points}` : points;
    pointsDisplay.style.color = points > 0 ? 'green' : 'red';
    pointsDisplay.style.fontWeight = 'bold';
    
    // Append to score display area in the HUD
    const scoreContainer = document.getElementById('score-display'); // Assuming score-display is the container
    scoreContainer.appendChild(pointsDisplay);

    // Animate and remove the points display
    setTimeout(() => {
        pointsDisplay.style.transition = 'opacity 1s, transform 1s';
        pointsDisplay.style.opacity = '0';
        pointsDisplay.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            scoreContainer.removeChild(pointsDisplay);
        }, 1000);
    }, 10);
}

// Change character size
function updateCharacterSize(change) {
    characterSize += change;
    // Ensure minimum size
    if (characterSize < 0.5) characterSize = 0.5; // Minimum size an eighth of original
    if (characterSize > 10) characterSize = 10; // Maximum size ten times original
    character.style.fontSize = `${characterSize}rem`;
}

// Check for collision between character (map center) and an item (marker)
function checkCollision() {
    if (!map) return;
    const characterLatLng = map.getCenter();

    for (let i = allItemsOnMap.length - 1; i >= 0; i--) {
        const item = allItemsOnMap[i];
        const distance = google.maps.geometry.spherical.computeDistanceBetween(characterLatLng, item.latLng);

        if (distance < collisionRadius) {
            handleItemCollision(item, i);
        }
    }
}

// Handle collision with an item
function handleItemCollision(item, index) {
    createBrownExplosion(item.marker.getPosition()); // Create brown explosion at item's location
    playRandomFartSound(); // Play a fart sound on any collision

    updateScore(item.type.points);
    recentlyEatenItems.push(item.type.emoji); // Add emoji to recently eaten list

    if (item.type.type === 'person') {
        updateCharacterSize(item.type.sizeIncrease);
        character.classList.add('eating'); // or a new class like 'growing'
        setTimeout(() => character.classList.remove('eating'), 300);
        
        peopleExplodedCount++;
        if (peopleExplodedCount % AI_POOPLORD_SPAWN_THRESHOLD === 0) {
            spawnAIPooplord();
        }

    } else if (item.type.type === 'food') {
        // Food no longer changes size
        character.classList.add('eating');
        setTimeout(() => character.classList.remove('eating'), 300);
    } else if (item.type.type === 'non-edible') {
        if (item.type.emoji === '💣') { // Only bombs decrease size
            updateCharacterSize(-item.type.sizeDecrease);
        }
        character.classList.add('hurt');
        setTimeout(() => character.classList.remove('hurt'), 300);

        // Apply drugged effect for needles and pills
        if (item.type.emoji === '💉' || item.type.emoji === '💊') {
            character.classList.add('drugged-effect');
            speakText("holy crap"); // Speak on drugged effect
            // Remove the class after the animation duration (1s) to allow re-triggering
            setTimeout(() => {
                character.classList.remove('drugged-effect');
            }, 1000); // Matches CSS animation duration
        }
    }

    // Remove the marker from the map
    item.marker.setMap(null);
    allItemsOnMap.splice(index, 1);

    // Spawn a new item (marker)
    setTimeout(() => {
        createItem();
    }, Math.random() * 1000 + 500);
}

// Start collision detection
function startCollisionDetection() {
    setInterval(checkCollision, 100); // Check for collisions every 100ms
}

// Google Maps initialization
// Make sure initMap is globally available for the Google Maps API callback
window.initMap = function() {
    console.log("Google Maps API loaded. Initializing map...");
    
    // Initialize background music but don't play it yet
    if (!backgroundMusic) {
        backgroundMusic = new Audio('pooplord.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.4; // Adjusted volume (0.0 to 1.0)
        // backgroundMusic.play().catch(error => console.error("Error playing background music:", error)); // Don't play here
    }
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We use our own markers
        preserveViewport: true, // Don't zoom to fit the route
        polylineOptions: {
            strokeColor: "transparent", // Make the route line invisible
            strokeOpacity: 0
        }
    });

    // Check if geolocation is supported by the browser
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                console.log(`User location: ${userLocation.lat}, ${userLocation.lng}`);
                
                // Create map centered at user's location
                map = new google.maps.Map(gameContainer, {
                    center: userLocation,
                    zoom: 18, // Zoom in a bit more for satellite view
                    disableDefaultUI: true, // Remove default UI controls
                    mapTypeId: 'hybrid' // Set map type to hybrid (satellite with labels)
                    // styles: [ ... ] // Remove or comment out custom styles
                });
                
                directionsRenderer.setMap(map); // Attach renderer to the map
                
                // Make sure character stays on top of the map
                gameContainer.appendChild(character);
                
                // Initialize character position
                initializeCharacterPosition();
                
                // Initialize items on the map
                initializeItems();
                adaptUIForDevice(); // Adapt UI after items and map are ready
                
                // No need to try playing music here anymore, will be handled by user interaction
                /*
                if (backgroundMusic && backgroundMusic.paused) {
                    backgroundMusic.play().catch(error => console.error("Error playing background music (fallback):", error));
                }
                */
            },
            // Error callback
            (error) => {
                console.error("Error getting user location:", error);
                alert("We need your location to place Pooplord in your area! Please enable location services.");
                
                // Fallback to a default location (e.g., San Francisco)
                const defaultLocation = { lat: 37.7749, lng: -122.4194 };
                map = new google.maps.Map(gameContainer, {
                    center: defaultLocation,
                    zoom: 18, // Zoom in a bit more for satellite view
                    disableDefaultUI: true,
                    mapTypeId: 'hybrid' // Set map type to hybrid for fallback too
                    // styles: [ ... ] // Remove or comment out custom styles
                });
                
                directionsRenderer.setMap(map); // Attach renderer to the map for fallback
                
                gameContainer.appendChild(character);
                initializeCharacterPosition();
                initializeItems();
                adaptUIForDevice(); // Adapt UI for fallback scenario too
                // No need to try playing music here anymore
                /*
                if (backgroundMusic && backgroundMusic.paused) {
                     backgroundMusic.play().catch(error => console.error("Error playing background music (fallback error path):", error));
                }
                */
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
        alert("Your browser doesn't support geolocation, which is required for this game.");
    }
}

// Define item types
const foodItems = [
    { emoji: '🍎', points: 10, type: 'food' },
    { emoji: '🍕', points: 15, type: 'food' },
    { emoji: '🍩', points: 20, type: 'food' },
    { emoji: '🌮', points: 12, type: 'food' },
    { emoji: '🍦', points: 18, type: 'food' }
];

const nonEdibleItems = [
    { emoji: '💉', points: -10, type: 'non-edible' },
    { emoji: '💊', points: -5, type: 'non-edible' },
    { emoji: '🚬', points: -10, type: 'non-edible' },
    { emoji: '💣', points: -50, type: 'non-edible', sizeDecrease: 0.5 } // Only bomb decreases size
];

const peopleEmojis = [
    '🚶', '🚶‍♂️', '🚶‍♀️', '🚶‍➡️', '🚶‍♀️‍➡️', '🚶‍♂️‍➡️',
    '🧍', '🧍‍♂️', '🧍‍♀️',
    '🧎', '🧎‍♂️', '🧎‍♀️', '🧎‍➡️', '🧎‍♀️‍➡️', '🧎‍♂️‍➡️',
    '🧑‍🦯', '🧑‍🦯‍➡️', '👨‍🦯', '👨‍🦯‍➡️', '👩‍🦯', '👩‍🦯‍➡️',
    '🧑‍🦼', '🧑‍🦼‍➡️', '👨‍🦼', '👨‍🦼‍➡️', '👩‍🦼', '👩‍🦼‍➡️'
];

const peopleItemTypes = peopleEmojis.map(emoji => ({
    emoji: emoji,
    points: 25,
    type: 'person',
    sizeIncrease: 0.25 // People increase size
}));

const mushroomItem = [
    { emoji: '🍄', points: 1500, type: 'mushroom' } // Super high points, special reflection type
];

const allItemTypes = [...foodItems, ...nonEdibleItems, ...peopleItemTypes, ...mushroomItem];
let allItemsOnMap = []; // Array to store active item markers
const collisionRadius = 20; // meters for collision detection with markers

// Create a "brown explosion" animation at a given LatLng
function createBrownExplosion(position) {
    const explosionEmoji = '💨'; // Or another suitable emoji like '💥' or a brown circle unicode
    const explosionMarker = new google.maps.Marker({
        position: position,
        map: map,
        label: {
            text: explosionEmoji,
            fontSize: '2rem', // Initial size
            className: 'map-emoji-label explosion-animation' // For CSS animation
        },
        icon: {
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Tiny transparent PNG
            scaledSize: new google.maps.Size(1, 1)
        },
        zIndex: 100 // Ensure it's above other items briefly
    });

    // CSS will handle the animation: expand, fade out
    // Remove the marker after animation (e.g., 1 second)
    setTimeout(() => {
        explosionMarker.setMap(null);
    }, 1000); // Duration of explosion visibility
}

// Define items
const itemSpawnRadius = 500; // Spawn items within 500 meters of map center

// Create and display items on the map as markers
function createItem() {
    if (!map) return;

    const mapCenter = map.getCenter();
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * itemSpawnRadius; // meters

    // Calculate a random LatLng position within the radius
    const positionLatLng = google.maps.geometry.spherical.computeOffset(mapCenter, randomRadius, randomAngle * (180 / Math.PI));

    // Randomly select an item type from all available types
    const itemTypeDetails = allItemTypes[Math.floor(Math.random() * allItemTypes.length)];

    // Default: no specific route, item will just float or appear
    spawnMarkerAtPoint(itemTypeDetails, positionLatLng);
}

// Function to spawn a marker at a specific point (potentially with a route)
function spawnMarkerAtPoint(itemTypeDetails, positionLatLng, route = null) {
    const initialEmoji = (itemTypeDetails.type === 'person') ? peopleEmojis[0] : itemTypeDetails.emoji;
    const markerLabel = {
        text: initialEmoji,
        fontSize: '2rem', // Make emoji larger
        className: 'map-emoji-label' // Add class for potential styling
    };

    const marker = new google.maps.Marker({
        position: positionLatLng,
        map: map,
        label: markerLabel,
        icon: {
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Tiny transparent PNG
            scaledSize: new google.maps.Size(1, 1) // Makes the default icon invisible
        },
        // animation: google.maps.Animation.DROP, // Optional: drop animation when appearing
        // draggable: false // Items should not be draggable by user
    });

    const itemObject = {
        marker: marker,
        type: itemTypeDetails, // Store the full type details (emoji, points, effects)
        latLng: positionLatLng, // Store LatLng for distance calculation
        isFood: itemTypeDetails.type === 'food', // Keep for compatibility if needed, but prefer item.type.type
        isPerson: itemTypeDetails.type === 'person',
        isNonEdible: itemTypeDetails.type === 'non-edible',
        // Properties for wandering movement
        currentMovementAngle: Math.random() * 360, // Initial random direction
        stepsTakenInDirection: 0
    };

    if (itemTypeDetails.type === 'person') {
        itemObject.emojiFrames = peopleEmojis; // Reference to the global array of people emojis
        itemObject.currentFrameIndex = 0;
        itemObject.lastFrameChangeTime = performance.now();
    }

    if (route) {
        itemObject.route = route;
        itemObject.routeStep = 0;
        itemObject.animationFrameId = null; // For controlling movement animation
    }

    allItemsOnMap.push(itemObject);
    console.log(`Spawned ${itemTypeDetails.emoji} at ${positionLatLng.lat()}, ${positionLatLng.lng()}`);
}

// Start spawning items
function startItemSpawning() {
    setInterval(() => {
        // createItem no longer takes an argument for type, it picks randomly
        createItem(); 
    }, itemSpawnInterval);
}

// Move all items on the map
function moveItems() {
    if (!map) return;
    const now = performance.now();

    for (let i = allItemsOnMap.length - 1; i >= 0; i--) {
        const item = allItemsOnMap[i]; // This is our itemObject

        // Wandering Movement Logic for ALL items
        item.stepsTakenInDirection++;
        if (item.stepsTakenInDirection >= ITEM_STEPS_BEFORE_TURN) {
            item.currentMovementAngle = Math.random() * 360; // Pick new random direction
            item.stepsTakenInDirection = 0;
        }

        // Calculate new position based on current angle and speed
        const newPosition = google.maps.geometry.spherical.computeOffset(
            item.latLng, // Current position
            ITEM_WANDER_SPEED, // Distance to move in this step
            item.currentMovementAngle // Direction of movement
        );

        if (newPosition) {
            item.marker.setPosition(newPosition);
            item.latLng = newPosition; // Update stored LatLng in our itemObject
        } else {
            // If computeOffset somehow fails (e.g. item at pole), pick new direction immediately
            item.currentMovementAngle = Math.random() * 360;
            item.stepsTakenInDirection = 0;
            continue; // Skip to next item for this frame
        }

        // Person Emoji Animation (if applicable)
        if (item.isPerson && item.emojiFrames) {
            if (now - item.lastFrameChangeTime > PERSON_FRAME_CHANGE_INTERVAL) {
                item.currentFrameIndex = (item.currentFrameIndex + 1) % item.emojiFrames.length;
                const newLabel = {
                    text: item.emojiFrames[item.currentFrameIndex],
                    fontSize: '2rem',
                    className: 'map-emoji-label'
                };
                item.marker.setLabel(newLabel);
                item.lastFrameChangeTime = now;
            }
        }
    }
}

// Start item movement
function startItemMovement() {
    setInterval(moveItems, itemMovementInterval);
}

function initializeCharacterPosition() {
    // Center character on screen
    // This doesn't move the DOM element anymore, but good for initial logical setup if needed
    characterX = gameContainer.offsetWidth / 2;
    characterY = gameContainer.offsetHeight / 2;

    // Add event listeners for desktop
    document.addEventListener('keydown', (event) => {
        if (!map) return;
        let panX = 0;
        let panY = 0;
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                panY = -characterSpeed;
                character.classList.add('moving');
                break;
            case 'ArrowDown':
            case 's':
                panY = characterSpeed;
                character.classList.add('moving');
                break;
            case 'ArrowLeft':
            case 'a':
                panX = -characterSpeed;
                character.classList.add('moving');
                break;
            case 'ArrowRight':
            case 'd':
                panX = characterSpeed;
                character.classList.add('moving');
                break;
        }
        if (panX !== 0 || panY !== 0) {
            map.panBy(panX, panY);
        }
    });

    document.addEventListener('keyup', (event) => {
        // Remove moving class when key is released (optional, for visual feedback)
        if (['ArrowUp', 'w', 'ArrowDown', 's', 'ArrowLeft', 'a', 'ArrowRight', 'd'].includes(event.key)) {
            character.classList.remove('moving');
        }
    });

    // Add event listeners for mobile (touch)
    let touchStartX, touchStartY;
    let isDragging = false;

    character.addEventListener('touchstart', (event) => {
        if (!map) return;
        isDragging = true;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        character.style.cursor = 'grabbing';
        character.classList.add('moving'); // Add moving class on touch start
        event.preventDefault(); // Prevent page scrolling
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
        if (!isDragging || !map) return;
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;

        // Pan the map inversely to the drag direction
        map.panBy(-deltaX * 0.2, -deltaY * 0.2); // Adjust multiplier for sensitivity
        
        touchStartX = touchX;
        touchStartY = touchY;
        event.preventDefault(); // Prevent page scrolling
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        character.style.cursor = 'grab';
        character.classList.remove('moving'); // Remove moving class on touch end
    });
}

// Initialize items
function initializeItems() {
    // Spawn initial items
    for (let i = 0; i < 10; i++) { // Start with 10 items
        createItem();
    }
    startItemSpawning(); // Start continuous spawning
    startItemMovement(); // Start item movement
    startCollisionDetection(); // Start collision detection with player
    setInterval(updateAIPooplords, 200); // Update AI pooplords every 200ms
    startReflectionTimer(); // Start the timer for Pooplord's reflections
}

// Leaderboard functionality removed

// Utility function to check for mobile devices
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
}

function adaptUIForDevice() {
    if (isMobileDevice()) {
        const instructionsContent = document.getElementById('instructions-content');
        if (instructionsContent) {
            const paragraphs = instructionsContent.getElementsByTagName('p');
            for (let p of paragraphs) {
                if (p.textContent.includes('Arrow keys') || p.textContent.includes('WASD') || p.textContent.includes('Desktop')) {
                    p.style.display = 'none';
                }
            }
        }
    }
}

// Function to play a random fart sound
function playRandomFartSound() {
    if (!areSfxOn || fartSounds.length === 0) return; // Check if SFX are enabled
    const randomIndex = Math.floor(Math.random() * fartSounds.length);
    const soundToPlay = fartSounds[randomIndex];
    const soundEffect = new Audio(soundToPlay);
    soundEffect.volume = 0.7; // Adjust volume for sound effects if needed
    soundEffect.play().catch(error => console.error(`Error playing sound ${soundToPlay}:`, error));
}

// Function to make the browser speak text
function speakText(textToSpeak) {
    if (!areSfxOn || !('speechSynthesis' in window)) return; // Check if SFX are enabled

    // Cancel any previous utterances to prevent overlap / queue buildup
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    // Optional: Configure voice, pitch, rate
    // utterance.voice = speechSynthesis.getVoices().find(voice => voice.name === 'Google UK English Male'); // Example voice
    utterance.pitch = 1.8; // 0 to 2, default is 1. Higher is more high-pitched.
    // utterance.rate = 1; // 0.1 to 10
    // utterance.volume = 1; // 0 to 1 (already default)
    
    window.speechSynthesis.speak(utterance);
}

// Event listeners for sound toggle buttons
if (musicToggleButton) {
    musicToggleButton.addEventListener('click', () => {
        isMusicOn = !isMusicOn;
        musicToggleButton.textContent = isMusicOn ? '🎵' : '🔇'; // Update icon
        if (backgroundMusic) {
            if (isMusicOn) {
                if (hasUserInteracted && backgroundMusic.paused) { // Only play if user has interacted and it's paused
                    backgroundMusic.play().catch(error => console.error("Error playing background music (toggle):", error));
                }
            } else {
                backgroundMusic.pause();
            }
        }
        // Ensure user interaction flag is set if music is turned on via button
        if (isMusicOn && !hasUserInteracted) {
            hasUserInteracted = true;
            // Attempt to play if paused, as this is now a valid user interaction
            if (backgroundMusic && backgroundMusic.paused) {
                 backgroundMusic.play().catch(error => console.error("Error playing background music (initial toggle):", error));
            }
        }
    });
}

if (sfxToggleButton) {
    sfxToggleButton.addEventListener('click', () => {
        areSfxOn = !areSfxOn;
        sfxToggleButton.textContent = areSfxOn ? '🔊' : '🔇'; // Update icon
        // If SFX are turned off, cancel any ongoing speech
        if (!areSfxOn && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        // Attempt to prime speech synthesis on iOS when SFX are first enabled by user
        if (areSfxOn && !hasUserInteracted && 'speechSynthesis' in window) {
            console.log("Attempting to prime Speech Synthesis for iOS...");
            // Create a very short, silent utterance
            const primingUtterance = new SpeechSynthesisUtterance(' '); // A single space or empty string
            primingUtterance.volume = 0; // Make it silent
            primingUtterance.rate = 10; // Speak it fast
            primingUtterance.pitch = 0.1; // Low pitch
            
            window.speechSynthesis.speak(primingUtterance);
            // Note: This might still require a brief sound to actually unlock audio context on some iOS versions.
            // We are also relying on the fact that hasUserInteracted is set *after* this block.
        }

         // Ensure user interaction flag is set if sfx are turned on via button
        if (areSfxOn && !hasUserInteracted) {
           hasUserInteracted = true;
        }
    });
}

// Ensure that initMap is called after the DOM is fully loaded, including the new buttons
document.addEventListener('DOMContentLoaded', () => {
    // Initialization that depends on DOM elements can go here
    // For example, attaching event listeners to buttons if not already done globally
    // The Google Maps API script will call window.initMap itself once it's loaded.
});

// Function to spawn an AI Pooplord
function spawnAIPooplord() {
    console.log("Spawning an AI Pooplord!");
    const spawnPosition = map.getCenter(); // Spawn near player for now

    const aiMarker = new google.maps.Marker({
        position: spawnPosition,
        map: map,
        label: {
            text: '💩', // Poop emoji
            fontSize: '1.8rem', // Slightly smaller than player if desired
            className: 'map-emoji-label ai-pooplord-label' // For potential distinct styling
        },
        icon: { // Transparent icon to hide default pin
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            scaledSize: new google.maps.Size(1, 1),
            anchor: new google.maps.Point(0, 0),
        },
        zIndex: 9 // Below player character (z-index 10)
    });

    const newAIPooplord = {
        id: `ai-${aiPooplords.length}-${Date.now()}`,
        marker: aiMarker,
        target: null, // Will be assigned shortly
        state: 'seeking' // states: seeking, attacking
    };

    findTargetForAIPooplord(newAIPooplord);
    aiPooplords.push(newAIPooplord);
    // console.log("New AI pooplord created:", newAIPooplord);
}

function findTargetForAIPooplord(aiLord) {
    let closestPerson = null;
    let minDistance = Infinity;

    for (const item of allItemsOnMap) {
        if (item.type.type === 'person') {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                aiLord.marker.getPosition(),
                item.latLng
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestPerson = item;
            }
        }
    }
    aiLord.target = closestPerson;
    if (closestPerson) {
        // console.log(`AI Pooplord ${aiLord.id} targeting ${closestPerson.type.name} at ${closestPerson.latLng.toString()}`);
    } else {
        // console.log(`AI Pooplord ${aiLord.id} found no person targets.`);
        aiLord.state = 'idle'; // Or some other state if no targets
    }
}

function updateAIPooplords() {
    if (!map || aiPooplords.length === 0) return;

    for (let i = aiPooplords.length - 1; i >= 0; i--) {
        const aiLord = aiPooplords[i];

        if (!aiLord.marker || !aiLord.marker.getMap()) { // Check if marker exists and is on map
            aiPooplords.splice(i, 1); // Remove if marker is gone (e.g. due to external cleanup)
            // console.log(`Cleaned up AI Pooplord ${aiLord.id} as its marker is gone.`);
            continue;
        }

        if (aiLord.state === 'seeking' && !aiLord.target) {
            findTargetForAIPooplord(aiLord);
        }

        if (aiLord.target && aiLord.target.marker && aiLord.target.marker.getMap()) {
            const aiPosition = aiLord.marker.getPosition();
            const targetPosition = aiLord.target.latLng;

            const distanceToTarget = google.maps.geometry.spherical.computeDistanceBetween(aiPosition, targetPosition);

            if (distanceToTarget < AI_POOPLORD_TARGET_RADIUS) {
                // Reached target - "explode" person
                // console.log(`AI Pooplord ${aiLord.id} reached target ${aiLord.target.type.name}`);
                
                // Find the item in allItemsOnMap to remove it properly
                const targetIndex = allItemsOnMap.findIndex(item => item.id === aiLord.target.id);
                if (targetIndex !== -1) {
                    createBrownExplosion(aiLord.target.marker.getPosition());
                    playRandomFartSound(); // AI poops also make noise
                    updateScore(aiLord.target.type.points); // Add points to player's score

                    aiLord.target.marker.setMap(null); // Remove person marker
                    allItemsOnMap.splice(targetIndex, 1);
                    // console.log(`AI Pooplord ${aiLord.id} exploded ${aiLord.target.type.name}. Remaining items: ${allItemsOnMap.length}`);

                    // Spawn a new random item to replace the one consumed by AI
                    setTimeout(() => {
                        createItem();
                    }, Math.random() * 1000 + 500);

                } else {
                    console.warn(`AI Pooplord ${aiLord.id} target ${aiLord.target.id} not found in allItemsOnMap.`);
                }
                
                aiLord.target = null; // Reset target
                aiLord.state = 'seeking'; // Look for new target
                findTargetForAIPooplord(aiLord); // Immediately find new target
            } else {
                // Move towards target
                const heading = google.maps.geometry.spherical.computeHeading(aiPosition, targetPosition);
                const newPosition = google.maps.geometry.spherical.computeOffset(aiPosition, AI_POOPLORD_SPEED, heading);
                aiLord.marker.setPosition(newPosition);
            }
        } else if (aiLord.target && (!aiLord.target.marker || !aiLord.target.marker.getMap())) {
            // Target was removed by player or another AI, find new target
            // console.log(`AI Pooplord ${aiLord.id}\'s target was removed. Finding new target.`);
            aiLord.target = null;
            aiLord.state = 'seeking';
            findTargetForAIPooplord(aiLord);
        } else if (!aiLord.target && aiLord.state !== 'idle') {
            // No target, try to find one
            findTargetForAIPooplord(aiLord);
        }
    }
}

// --- DeepSeek Reflection Logic ---
function startReflectionTimer() {
    setInterval(requestPooplordReflection, REFLECTION_INTERVAL);
}

async function requestPooplordReflection() {
    if (!areSfxOn) return; // Don't request if sound effects (and thus speech) are off
    if (recentlyEatenItems.length === 0) {
        console.log("Pooplord has eaten nothing recently. No reflection needed.");
        return;
    }

    console.log("Requesting Pooplord reflection for items:", recentlyEatenItems);

    try {
        const response = await fetch('/api/get-pooplord-reflection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ eatenItems: [...recentlyEatenItems] }) // Send a copy
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error fetching reflection:", response.status, errorData.error, errorData.details);
            // Potentially speak an error message or handle differently
            // speakText("My bowels are blocked... I can't reflect right now."); 
            return;
        }

        const data = await response.json();
        if (data.reflection) {
            console.log("Pooplord reflects:", data.reflection);
            speakText(data.reflection);
            recentlyEatenItems = []; // Clear the list after successful reflection
        } else {
            console.error("No reflection content in response:", data);
        }
    } catch (error) {
        console.error("Failed to request Pooplord reflection:", error);
        // speakText("My digestive tract is in turmoil! No thoughts now...");
    }
} 