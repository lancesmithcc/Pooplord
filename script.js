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
let characterStrength = 10; // Character's strength

// Get score display element from the DOM
const scoreDisplay = document.getElementById('score-display');
// const gameInfo = document.getElementById('game-info'); // game-info is no longer used in JS

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
    score += points;
    scoreDisplay.innerHTML = `Score: ${score}`;
    
    // Visual feedback for score change
    const pointsDisplay = document.createElement('div');
    pointsDisplay.className = 'points-popup';
    pointsDisplay.textContent = points > 0 ? `+${points}` : points;
    pointsDisplay.style.position = 'absolute';
    pointsDisplay.style.left = `${characterX}px`;
    pointsDisplay.style.top = `${characterY - 30}px`;
    pointsDisplay.style.color = points > 0 ? 'green' : 'red';
    pointsDisplay.style.fontWeight = 'bold';
    pointsDisplay.style.zIndex = '25';
    gameContainer.appendChild(pointsDisplay);
    
    // Animate and remove the points display
    setTimeout(() => {
        pointsDisplay.style.transition = 'opacity 1s, transform 1s';
        pointsDisplay.style.opacity = '0';
        pointsDisplay.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            gameContainer.removeChild(pointsDisplay);
        }, 1000);
    }, 10);
}

// Change character size
function updateCharacterSize(change) {
    characterSize += change;
    // Ensure minimum size
    if (characterSize < 1) characterSize = 1;
    character.style.fontSize = `${characterSize}rem`;
}

// Change character speed
function updateCharacterSpeed(change) {
    // characterSpeed is defined above, adjust as needed
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
    // Effects (score, size) are the same
    if (item.isFood) {
        updateScore(item.type.points);
        updateCharacterSize(item.type.sizeIncrease);
        character.classList.add('eating');
        setTimeout(() => character.classList.remove('eating'), 300);
    } else {
        updateScore(item.type.points);
        updateCharacterSize(-item.type.sizeDecrease);
        character.classList.add('hurt');
        setTimeout(() => character.classList.remove('hurt'), 300);
    }

    // Remove the marker from the map
    item.marker.setMap(null);
    allItemsOnMap.splice(index, 1);

    // Spawn a new item (marker)
    setTimeout(() => {
        createItem(Math.random() < 0.7);
    }, Math.random() * 1000 + 500);
}

// Start collision detection
function startCollisionDetection() {
    setInterval(checkCollision, 100); // Check for collisions every 100ms
}

// Google Maps initialization
function initMap() {
    console.log("Google Maps API loaded. Initializing map...");
    
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
                    zoom: 17, // Close enough to see buildings and streets
                    disableDefaultUI: true, // Remove default UI controls
                    styles: [
                        // Custom Dark Mode Map Style (Charcoal, Brown, Green)
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] }, // Charcoal base
                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }, // Brownish labels
                        {
                            featureType: "administrative.locality",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#d59563" }], // Lighter brown for locality
                        },
                        {
                            featureType: "poi", // Points of Interest
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#938170" }], // Muted brown for POI labels
                        },
                        {
                            featureType: "poi.park", // Parks will be green
                            elementType: "geometry",
                            stylers: [{ color: "#263c3f" }], // Dark green for park geometry
                        },
                        {
                            featureType: "poi.park",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#6b9a76" }], // Lighter green for park labels
                        },
                        {
                            featureType: "road",
                            elementType: "geometry",
                            stylers: [{ color: "#38414e" }], // Darker charcoal for roads
                        },
                        {
                            featureType: "road",
                            elementType: "geometry.stroke",
                            stylers: [{ color: "#212a37" }],
                        },
                        {
                            featureType: "road",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#9ca5b3" }], // Light grey for road labels
                        },
                        {
                            featureType: "road.highway",
                            elementType: "geometry",
                            stylers: [{ color: "#746855" }], // Brown for highways
                        },
                        {
                            featureType: "road.highway",
                            elementType: "geometry.stroke",
                            stylers: [{ color: "#1f2835" }],
                        },
                        {
                            featureType: "road.highway",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#f3d19c" }], // Light brownish/yellow for highway labels
                        },
                        {
                            featureType: "transit",
                            elementType: "geometry",
                            stylers: [{ color: "#2f3948" }],
                        },
                        {
                            featureType: "transit.station",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#d59563" }],
                        },
                        {
                            featureType: "water",
                            elementType: "geometry",
                            stylers: [{ color: "#17263c" }], // Dark blue/charcoal for water
                        },
                        {
                            featureType: "water",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#515c6d" }],
                        },
                        {
                            featureType: "water",
                            elementType: "labels.text.stroke",
                            stylers: [{ color: "#17263c" }],
                        },
                    ]
                });
                
                // Make sure character stays on top of the map
                gameContainer.appendChild(character);
                
                // Initialize character position
                initializeCharacterPosition();
                
                // Initialize items on the map
                initializeItems();
            },
            // Error callback
            (error) => {
                console.error("Error getting user location:", error);
                alert("We need your location to place Pooplord in your area! Please enable location services.");
                
                // Fallback to a default location (e.g., San Francisco)
                const defaultLocation = { lat: 37.7749, lng: -122.4194 };
                map = new google.maps.Map(gameContainer, {
                    center: defaultLocation,
                    zoom: 17,
                    disableDefaultUI: true,
                    styles: [ // Apply dark mode to fallback map too
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                        {
                            featureType: "administrative.locality",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#d59563" }],
                        },
                        {
                            featureType: "poi.park",
                            elementType: "geometry",
                            stylers: [{ color: "#263c3f" }],
                        },
                        {
                            featureType: "poi.park",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#6b9a76" }],
                        },
                        {
                            featureType: "road",
                            elementType: "geometry",
                            stylers: [{ color: "#38414e" }],
                        },
                        {
                            featureType: "road",
                            elementType: "geometry.stroke",
                            stylers: [{ color: "#212a37" }],
                        },
                        {
                            featureType: "road",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#9ca5b3" }],
                        },
                        {
                            featureType: "road.highway",
                            elementType: "geometry",
                            stylers: [{ color: "#746855" }],
                        },
                        {
                            featureType: "water",
                            elementType: "geometry",
                            stylers: [{ color: "#17263c" }],
                        },
                        {
                            featureType: "water",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#515c6d" }],
                        }
                    ]
                });
                
                gameContainer.appendChild(character);
                initializeCharacterPosition();
                initializeItems();
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

// Game items configuration
const foodItems = [
    { emoji: '🍎', name: 'Apple', points: 10, sizeIncrease: 0.1, speedIncrease: 0.5 },
    { emoji: '🍌', name: 'Banana', points: 15, sizeIncrease: 0.15, speedIncrease: 0.7 },
    { emoji: '🍕', name: 'Pizza', points: 25, sizeIncrease: 0.2, speedIncrease: 0.3 },
    { emoji: '🍔', name: 'Burger', points: 30, sizeIncrease: 0.25, speedIncrease: 0.2 },
    { emoji: '🍦', name: 'Ice Cream', points: 20, sizeIncrease: 0.15, speedIncrease: 0.5 },
    { emoji: '🍩', name: 'Donut', points: 15, sizeIncrease: 0.2, speedIncrease: 0.4 }
];

const nonEdibleItems = [
    { emoji: '💉', name: 'Needle', points: -20, sizeDecrease: 0.15, speedDecrease: 0.6 },
    { emoji: '💊', name: 'Pill', points: -15, sizeDecrease: 0.1, speedDecrease: 0.4 },
    { emoji: '🚬', name: 'Cigarette', points: -10, sizeDecrease: 0.05, speedDecrease: 0.3 },
    { emoji: '💣', name: 'Bomb', points: -30, sizeDecrease: 0.25, speedDecrease: 0.7 }
];

const allItemsOnMap = []; // Track all items currently on the map
const maxItems = 15; // Maximum number of items on the map at once
const itemSpawnInterval = 2000; // New item every 2 seconds (if below maxItems)
const itemMovementInterval = 50; // Update item positions every 50ms - will be used differently now
const collisionCheckInterval = 100; // How often to check for collisions
const itemSpawnRadius = 500; // Meters from map center to spawn items
const collisionRadius = 20; // Meters from character (map center) to trigger collision

// Create and add an item to the map as a Google Maps Marker
function createItem(isFood = true) {
    if (allItemsOnMap.length >= maxItems || !map) return;

    const itemsArray = isFood ? foodItems : nonEdibleItems;
    const itemType = itemsArray[Math.floor(Math.random() * itemsArray.length)];

    // Calculate a random LatLng position near the map center
    const mapCenter = map.getCenter();
    const randomAngle = Math.random() * 360;
    const randomDistance = Math.random() * itemSpawnRadius; // Spawn within X meters
    const itemLatLng = google.maps.geometry.spherical.computeOffset(mapCenter, randomDistance, randomAngle);

    const marker = new google.maps.Marker({
        position: itemLatLng,
        map: map,
        // icon: itemType.emoji, // Not directly supported, need to use custom icon or label
        label: {
            text: itemType.emoji,
            fontSize: '24px',
            className: isFood ? 'food-item-label' : 'non-edible-item-label' // For potential styling
        },
        // title: itemType.name // Shows on hover
        // We can make custom icons later if needed for better visuals
        zIndex: 5 // Ensure items are interactable but don't obscure character too much
    });

    const itemData = {
        marker: marker, // Store the marker object
        type: itemType,
        isFood: isFood,
        latLng: itemLatLng // Store LatLng for distance calculations
        // x, y, vx, vy, size, element are no longer needed in the same way
    };

    allItemsOnMap.push(itemData);
    return itemData;
}

// Spawn items periodically
function startItemSpawning() {
    setInterval(() => {
        // 70% chance of spawning food, 30% chance of spawning non-edible
        const spawnFood = Math.random() < 0.7;
        createItem(spawnFood);
    }, itemSpawnInterval);
}

// Move all items on the map - FOR NOW, ITEMS ARE STATIONARY MARKERS
function moveItems() {
    // This function will need to be re-thought if items are to move as markers.
    // For now, markers are stationary. Their LatLng is fixed unless we update it.
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
    // Add initial items
    for (let i = 0; i < 5; i++) {
        createItem(Math.random() < 0.7); // 70% chance of food
    }
    
    // Start spawning and movement
    startItemSpawning();
    startItemMovement();
    startCollisionDetection();
}

// Leaderboard functionality
const leaderboardButton = document.getElementById('leaderboard-button');
const leaderboardModal = document.getElementById('leaderboard-modal');
const closeButton = document.querySelector('.close-button');
const saveScoreButton = document.getElementById('save-score-button');
const playerNameInput = document.getElementById('player-name');
const leaderboardBody = document.getElementById('leaderboard-body');

// Open the leaderboard modal when clicking the button
leaderboardButton.addEventListener('click', () => {
    leaderboardModal.style.display = 'flex';
    displayLeaderboard();
});

// Close the modal when clicking the close button
closeButton.addEventListener('click', () => {
    leaderboardModal.style.display = 'none';
});

// Close the modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === leaderboardModal) {
        leaderboardModal.style.display = 'none';
    }
});

// Save the player's score
saveScoreButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (playerName === '') {
        alert('Please enter your name!');
        return;
    }
    
    saveScore(playerName, score);
    displayLeaderboard();
    playerNameInput.value = '';
});

// Load scores from localStorage
function getLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('pooplordLeaderboard')) || [];
    return leaderboard;
}

// Save score to localStorage
function saveScore(name, score) {
    const leaderboard = getLeaderboard();
    
    // Add new score
    leaderboard.push({ name, score, date: new Date().toISOString() });
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 10 scores
    const topScores = leaderboard.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('pooplordLeaderboard', JSON.stringify(topScores));
}

// Display leaderboard in the modal
function displayLeaderboard() {
    const leaderboard = getLeaderboard();
    
    // Clear existing rows
    leaderboardBody.innerHTML = '';
    
    // Add each score as a row
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entry.name;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = entry.score;
        
        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        
        leaderboardBody.appendChild(row);
    });
    
    // If no scores yet, display a message
    if (leaderboard.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = 'No scores yet. Be the first!';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        leaderboardBody.appendChild(row);
    }
} 