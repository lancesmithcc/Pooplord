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
const milestonePhrases = ["oh crap yeah", "cool poo man", "super duty!"];

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

    if (item.type.type === 'person') {
        updateCharacterSize(item.type.sizeIncrease);
        character.classList.add('eating'); // or a new class like 'growing'
        setTimeout(() => character.classList.remove('eating'), 300);
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

const allItemTypes = [...foodItems, ...nonEdibleItems, ...peopleItemTypes];
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
    // Initial position based on CSS (centered)
    characterX = character.offsetLeft;
    characterY = character.offsetTop;
    console.log(`Character initial position: x=${characterX}, y=${characterY}`);
}

document.addEventListener('keydown', (event) => {
    if (!hasUserInteracted && backgroundMusic && backgroundMusic.paused) {
        backgroundMusic.play().catch(error => console.error("Error starting background music on keydown:", error));
        hasUserInteracted = true;
    }

    const key = event.key.toLowerCase();
    let isMoving = false;
    let panX = 0;
    let panY = 0;

    if (key === 'arrowup' || key === 'w') {
        panY = -characterSpeed;
        isMoving = true;
    } else if (key === 'arrowdown' || key === 's') {
        panY = characterSpeed;
        isMoving = true;
    } else if (key === 'arrowleft' || key === 'a') {
        panX = -characterSpeed;
        isMoving = true;
    } else if (key === 'arrowright' || key === 'd') {
        panX = characterSpeed;
        isMoving = true;
    }

    if (map && (panX !== 0 || panY !== 0)) {
        map.panBy(panX, panY);
    }

    // Only add animation if actually moving
    if (isMoving) {
        character.classList.add('moving');
    }
});

document.addEventListener('keyup', (event) => {
    // Remove moving animation when key is released
    character.classList.remove('moving');
});

// Call initMap or a similar function if Google Maps API is not yet integrated
// For now, we can call initializeCharacterPosition directly if map isn't ready
if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
    // This will run if Google Maps API is not loaded yet
    // We need to ensure the DOM is ready before getting offsetLeft/Top
    document.addEventListener('DOMContentLoaded', () => {
        initializeCharacterPosition();
    });
}

// Touch controls for mobile devices
let isDragging = false;
let touchStartX = 0;
let touchStartY = 0;

character.addEventListener('touchstart', (event) => {
    if (!hasUserInteracted && backgroundMusic && backgroundMusic.paused) {
        backgroundMusic.play().catch(error => console.error("Error starting background music on touchstart:", error));
        hasUserInteracted = true;
    }

    isDragging = true;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // Change cursor style
    character.style.cursor = 'grabbing';
    character.classList.add('moving'); // Add moving animation
    
    // Prevent default to avoid scrolling the page
    event.preventDefault();
});

document.addEventListener('touchmove', (event) => {
    if (!isDragging || !map) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Pan the map in the opposite direction of the drag
    map.panBy(-deltaX / 2, -deltaY / 2); // Divide by 2 for less sensitive panning

    // Update start points for next move event
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // Prevent default to avoid scrolling the page
    event.preventDefault();
});

document.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
        character.style.cursor = 'grab';
        character.classList.remove('moving');
    }
});

document.addEventListener('touchcancel', () => {
    if (isDragging) {
        isDragging = false;
        character.style.cursor = 'grab';
        character.classList.remove('moving');
    }
});

// Initialize items when the map is ready
function initializeItems() {
    // Spawn an initial set of items
    for (let i = 0; i < 15; i++) { // Start with 15 items
        createItem(); // No need to pass isFood anymore
    }
    
    // Start spawning and movement
    startItemSpawning();
    startItemMovement();
    startCollisionDetection();
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