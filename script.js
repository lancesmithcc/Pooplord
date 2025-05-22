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
const characterSpeed = 10; // Pixels per move
let map; // Google Map instance
let score = 0; // Player's score
let characterSize = 2; // Character size multiplier (starts at 2rem)
let characterStrength = 10; // Character's strength

// Get score display element from the DOM
const scoreDisplay = document.getElementById('score-display');
const gameInfo = document.getElementById('game-info');

// Add a button to hide/show instructions
const hideInstructionsTimeout = setTimeout(() => {
    gameInfo.style.opacity = '0.3';
}, 5000); // Hide instructions after 5 seconds

// Show instructions when hovered
gameInfo.addEventListener('mouseenter', () => {
    clearTimeout(hideInstructionsTimeout);
    gameInfo.style.opacity = '1';
});

gameInfo.addEventListener('mouseleave', () => {
    gameInfo.style.opacity = '0.3';
});

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

// Check for collision between character and an item
function checkCollision() {
    const charRect = character.getBoundingClientRect();
    
    for (let i = allItemsOnMap.length - 1; i >= 0; i--) {
        const item = allItemsOnMap[i];
        const itemRect = item.element.getBoundingClientRect();
        
        // Simple rectangular collision detection
        if (
            charRect.left < itemRect.right &&
            charRect.right > itemRect.left &&
            charRect.top < itemRect.bottom &&
            charRect.bottom > itemRect.top
        ) {
            // Collision detected!
            handleItemCollision(item, i);
        }
    }
}

// Handle collision with an item
function handleItemCollision(item, index) {
    if (item.isFood) {
        // Handle food item
        updateScore(item.type.points);
        updateCharacterSize(item.type.sizeIncrease);
        
        // Animation for eating
        character.classList.add('eating');
        setTimeout(() => {
            character.classList.remove('eating');
        }, 300);
        
        // Play sound or show animation here if desired
    } else {
        // Handle non-edible item
        updateScore(item.type.points);
        updateCharacterSize(-item.type.sizeDecrease);
        
        // Animation for getting hurt
        character.classList.add('hurt');
        setTimeout(() => {
            character.classList.remove('hurt');
        }, 300);
        
        // Play sound or show animation here if desired
    }
    
    // Animate item being consumed
    item.element.style.transition = 'all 0.3s ease-out';
    if (item.isFood) {
        // Food gets eaten (scale down and move to character)
        item.element.style.transform = 'scale(0)';
        item.element.style.left = `${characterX}px`;
        item.element.style.top = `${characterY}px`;
    } else {
        // Non-edible hurts (shake and fade)
        item.element.style.transform = 'rotate(90deg) scale(0)';
        item.element.style.opacity = '0';
    }
    
    // Remove the item after animation completes
    setTimeout(() => {
        if (gameContainer.contains(item.element)) {
            gameContainer.removeChild(item.element);
        }
        allItemsOnMap.splice(index, 1);
        
        // Spawn a new item to replace the one that was removed
        setTimeout(() => {
            createItem(Math.random() < 0.7);
        }, Math.random() * 1000 + 500); // Random delay between 500ms and 1500ms
    }, 300);
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
                        // Custom map style to make it more game-like
                        // Remove business markers, make colors more vibrant
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        },
                        {
                            featureType: "road",
                            elementType: "geometry",
                            stylers: [{ color: "#f5f5f5" }]
                        },
                        {
                            featureType: "landscape",
                            elementType: "geometry",
                            stylers: [{ color: "#e8e8e8" }]
                        }
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
                    disableDefaultUI: true
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
const itemMovementInterval = 50; // Update item positions every 50ms

// Create and add an item to the map
function createItem(isFood = true) {
    if (allItemsOnMap.length >= maxItems) return; // Don't create more items if at max
    
    // Choose a random item type
    const itemsArray = isFood ? foodItems : nonEdibleItems;
    const itemType = itemsArray[Math.floor(Math.random() * itemsArray.length)];
    
    // Create a DOM element for the item
    const itemElement = document.createElement('div');
    itemElement.textContent = itemType.emoji;
    itemElement.className = isFood ? 'food-item' : 'non-edible-item';
    itemElement.classList.add('game-item');
    
    // Random position within the game container
    const containerRect = gameContainer.getBoundingClientRect();
    const itemSize = 30; // Base size in pixels
    
    const randomX = Math.random() * (containerRect.width - itemSize);
    const randomY = Math.random() * (containerRect.height - itemSize);
    
    itemElement.style.left = `${randomX}px`;
    itemElement.style.top = `${randomY}px`;
    itemElement.style.position = 'absolute';
    itemElement.style.fontSize = `${itemSize}px`;
    itemElement.style.zIndex = '5'; // Below character but above map
    
    // Add to game container
    gameContainer.appendChild(itemElement);
    
    // Store item data
    const itemData = {
        element: itemElement,
        type: itemType,
        isFood: isFood,
        x: randomX,
        y: randomY,
        vx: (Math.random() - 0.5) * 2, // Random velocity X
        vy: (Math.random() - 0.5) * 2, // Random velocity Y
        size: itemSize
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

// Move all items on the map
function moveItems() {
    for (let i = 0; i < allItemsOnMap.length; i++) {
        const item = allItemsOnMap[i];
        
        // Update position based on velocity
        item.x += item.vx;
        item.y += item.vy;
        
        // Bounce off walls
        const containerRect = gameContainer.getBoundingClientRect();
        if (item.x <= 0 || item.x + item.size >= containerRect.width) {
            item.vx *= -1; // Reverse horizontal direction
        }
        if (item.y <= 0 || item.y + item.size >= containerRect.height) {
            item.vy *= -1; // Reverse vertical direction
        }
        
        // Apply new position
        item.element.style.left = `${item.x}px`;
        item.element.style.top = `${item.y}px`;
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
    const key = event.key.toLowerCase();
    let newX = characterX;
    let newY = characterY;
    let isMoving = false;

    if (key === 'arrowup' || key === 'w') {
        newY -= characterSpeed;
        isMoving = true;
    } else if (key === 'arrowdown' || key === 's') {
        newY += characterSpeed;
        isMoving = true;
    } else if (key === 'arrowleft' || key === 'a') {
        newX -= characterSpeed;
        isMoving = true;
    } else if (key === 'arrowright' || key === 'd') {
        newX += characterSpeed;
        isMoving = true;
    }

    // Only add animation if actually moving
    if (isMoving) {
        character.classList.add('moving');
    }

    // Boundary checks for gameContainer
    const charRect = character.getBoundingClientRect(); // Get current size
    const containerRect = gameContainer.getBoundingClientRect();

    // Adjust for character size to keep it fully within bounds
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + charRect.width > containerRect.width) newX = containerRect.width - charRect.width;
    if (newY + charRect.height > containerRect.height) newY = containerRect.height - charRect.height;

    characterX = newX;
    characterY = newY;
    character.style.left = `${characterX}px`;
    character.style.top = `${characterY}px`;
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
let touchOffsetX = 0;
let touchOffsetY = 0;

character.addEventListener('touchstart', (event) => {
    isDragging = true;
    
    // Calculate the offset between touch point and character position
    const touch = event.touches[0];
    const charRect = character.getBoundingClientRect();
    touchOffsetX = touch.clientX - charRect.left;
    touchOffsetY = touch.clientY - charRect.top;
    
    // Change cursor style
    character.style.cursor = 'grabbing';
    
    // Prevent default to avoid scrolling the page
    event.preventDefault();
});

document.addEventListener('touchmove', (event) => {
    if (!isDragging) return;
    
    const touch = event.touches[0];
    const containerRect = gameContainer.getBoundingClientRect();
    const charRect = character.getBoundingClientRect();
    
    // Add moving animation while dragging
    character.classList.add('moving');
    
    // Calculate new position relative to the container
    let newX = touch.clientX - containerRect.left - touchOffsetX;
    let newY = touch.clientY - containerRect.top - touchOffsetY;
    
    // Boundary checks
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + charRect.width > containerRect.width) {
        newX = containerRect.width - charRect.width;
    }
    if (newY + charRect.height > containerRect.height) {
        newY = containerRect.height - charRect.height;
    }
    
    // Update character position
    characterX = newX;
    characterY = newY;
    character.style.left = `${characterX}px`;
    character.style.top = `${characterY}px`;
    
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