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
let directionsService;
let directionsRenderer;

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
// Make sure initMap is globally available for the Google Maps API callback
window.initMap = function() {
    console.log("Google Maps API loaded. Initializing map...");
    
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
                
                directionsRenderer.setMap(map); // Attach renderer to the map
                
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
                    styles: [ // Duplicating styles for fallback, consider refactoring
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
                
                directionsRenderer.setMap(map); // Attach renderer to the map for fallback
                
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

// Define item types with their properties
const itemTypes = {
    food: [
        { emoji: '🍎', points: 10, sizeIncrease: 0.2, effect: 'grow' },
        { emoji: '🍌', points: 15, sizeIncrease: 0.3, effect: 'grow' },
        { emoji: '🍔', points: 20, sizeIncrease: 0.4, effect: 'grow' },
        { emoji: '🍕', points: 25, sizeIncrease: 0.5, effect: 'grow' },
        { emoji: '🍩', points: 30, sizeIncrease: 0.6, effect: 'grow' }
    ],
    nonEdible: [
        { emoji: '💉', points: -10, sizeDecrease: 0.2, effect: 'shrink' },
        { emoji: '💊', points: -15, sizeDecrease: 0.3, effect: 'shrink' },
        { emoji: '💣', points: -20, sizeDecrease: 0.4, effect: 'shrink' },
        { emoji: '💥', points: -25, sizeDecrease: 0.5, effect: 'shrink' },
        { emoji: '☠️', points: -30, sizeDecrease: 0.6, effect: 'shrink' }
    ]
};

// Create and place a new item (marker) on the map
function createItem(isFood = true) {
    if (!map || !directionsService) return;

    const itemTypeArray = isFood ? itemTypes.food : itemTypes.nonEdible;
    const randomType = itemTypeArray[Math.floor(Math.random() * itemTypeArray.length)];

    // Spawn items within a certain radius of the map center (player)
    const center = map.getCenter();
    const spawnRadius = 1000; // meters from center

    // Attempt to find a random point on a road
    const randomBearing = Math.random() * 360;
    const randomDist = Math.random() * spawnRadius;
    const originPoint = google.maps.geometry.spherical.computeOffset(center, randomDist, randomBearing);

    // For destination, pick another random point, somewhat further away
    const destBearing = Math.random() * 360;
    const destDist = (Math.random() * 500) + 500; // 500-1000m away
    const destinationPoint = google.maps.geometry.spherical.computeOffset(originPoint, destDist, destBearing);
    
    const request = {
        origin: originPoint,
        destination: destinationPoint,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            const route = result.routes[0];
            if (!route || !route.overview_path || route.overview_path.length === 0) {
                console.warn("Could not find a route or route is empty for item, spawning at random point.");
                // Fallback: spawn at originPoint without a route
                spawnMarkerAtPoint(randomType, isFood, originPoint, null);
                return;
            }

            // Spawn marker at the start of the route
            const startLatLng = route.overview_path[0];
            spawnMarkerAtPoint(randomType, isFood, startLatLng, route);

        } else {
            console.error('Directions request failed due to ' + status + '. Spawning item at random point.');
            // Fallback: spawn at originPoint without a route if directions fail
            spawnMarkerAtPoint(randomType, isFood, originPoint, null);
        }
    });
}

function spawnMarkerAtPoint(itemTypeDetails, isFood, positionLatLng, route) {
    const marker = new google.maps.Marker({
        position: positionLatLng,
        map: map,
        label: {
            text: itemTypeDetails.emoji,
            fontSize: '24px', // Make emoji larger
            color: 'black' // Ensure visibility against various backgrounds
        },
        icon: { // Hide default pin
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 transparent PNG
            scaledSize: new google.maps.Size(1, 1),
            anchor: new google.maps.Point(0, 0),
        },
        // Custom properties
        isFood: isFood,
        type: itemTypeDetails,
        latLng: positionLatLng, // Store LatLng for easier access
        route: route, // Store the route for this item
        routeStep: 0, // Current step in the route
        animationStartTime: performance.now(),
        animationDuration: route && route.legs && route.legs[0].duration ? route.legs[0].duration.value * 1000 : 5000 // milliseconds, default 5s if no route
    });

    allItemsOnMap.push(marker);

    // Add CSS animation for floating effect
    // This requires a DOM element, which markers are not directly.
    // We'll achieve visual movement by updating marker position.
    // The "float" animation will be handled by the moveItems function.

    if (route) {
        // If there's a route, movement will be handled by moveItems based on route.overview_path
        // console.log("Item spawned on route:", marker.type.emoji, marker.latLng.toString());
    } else {
        // If no route, maybe a simple fallback movement or stationary
        // console.log("Item spawned at point (no route):", marker.type.emoji, marker.latLng.toString());
    }
}

// Start spawning items
function startItemSpawning() {
    setInterval(() => {
        // 70% chance of spawning food, 30% chance of spawning non-edible
        const spawnFood = Math.random() < 0.7;
        createItem(spawnFood);
    }, itemSpawnInterval);
}

// Move all items on the map - FOR NOW, ITEMS ARE STATIONARY MARKERS
function moveItems() {
    if (!map) return;
    const now = performance.now();

    for (let i = allItemsOnMap.length - 1; i >= 0; i--) {
        const itemMarker = allItemsOnMap[i];

        if (itemMarker.route && itemMarker.route.overview_path && itemMarker.route.overview_path.length > 0) {
            const route = itemMarker.route;
            const path = route.overview_path;
            
            // Calculate how far along the path the item should be
            // This is a simple linear interpolation along the path segments.
            // A more robust approach would consider time and speed for each segment.
            
            let elapsedTime = now - itemMarker.animationStartTime;
            if (elapsedTime >= itemMarker.animationDuration) {
                elapsedTime = itemMarker.animationDuration; // Cap at duration
            }
            
            const progress = elapsedTime / itemMarker.animationDuration; // 0 to 1

            if (progress >= 1) { // Reached end of its current path segment or full path
                // For now, let's make it stationary or despawn/respawn
                // If we want continuous movement, we'd need to request a new route here or make it loop.
                // For simplicity, we'll just keep it at the end of its short path for now.
                 if (path.length > 0) {
                    itemMarker.setPosition(path[path.length - 1]);
                    itemMarker.latLng = path[path.length - 1];
                 }
                // Or, remove and respawn:
                // itemMarker.setMap(null);
                // allItemsOnMap.splice(i, 1);
                // createItem(itemMarker.isFood);
                continue; 
            }

            // Find the current position on the polyline
            // This is a simplified interpolation. Google's geometry library might have better tools.
            const totalPathDistance = google.maps.geometry.spherical.computeLength(path);
            const distanceToTravel = totalPathDistance * progress;
            
            let currentCumulativeDistance = 0;
            let targetPosition = path[0];

            for (let j = 0; j < path.length - 1; j++) {
                const segmentStart = path[j];
                const segmentEnd = path[j+1];
                const segmentDistance = google.maps.geometry.spherical.computeDistanceBetween(segmentStart, segmentEnd);

                if (currentCumulativeDistance + segmentDistance >= distanceToTravel) {
                    const distanceIntoSegment = distanceToTravel - currentCumulativeDistance;
                    const fractionIntoSegment = distanceIntoSegment / segmentDistance;
                    targetPosition = google.maps.geometry.spherical.interpolate(segmentStart, segmentEnd, fractionIntoSegment);
                    break;
                }
                currentCumulativeDistance += segmentDistance;
                if (j === path.length - 2) { // If we are at the last segment
                     targetPosition = path[path.length -1]; // Go to the end
                }
            }
            
            if(targetPosition) {
                itemMarker.setPosition(targetPosition);
                itemMarker.latLng = targetPosition; // Update stored LatLng
            }

        } else {
            // Fallback for items without a route (e.g., random float or stationary)
            // Simple floating animation (vertical bobbing)
            const floatAmplitude = 0.00001; // Small change in latitude for bobbing
            const floatSpeed = 0.002; // Adjust for desired speed
            const newLat = itemMarker.get('originalLat') || itemMarker.getPosition().lat();
            if(!itemMarker.get('originalLat')) itemMarker.set('originalLat', newLat);

            itemMarker.setPosition(new google.maps.LatLng(
                newLat + Math.sin(now * floatSpeed) * floatAmplitude,
                itemMarker.getPosition().lng()
            ));
            itemMarker.latLng = itemMarker.getPosition();
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

// Leaderboard functionality removed

// Call initMap or a similar function if Google Maps API is not yet integrated
// ... existing code ... 