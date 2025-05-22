# Pooplord

A fun game where you control a poop emoji walking through town (overlayed on the Google Map of your local area). Collect food items to grow stronger and avoid harmful items like needles, pills, cigarettes, and bombs.

## Setup

1. Clone this repository
2. Create a `.env` file in the root directory (copy from `env.example`)
3. Get a Google Maps JavaScript API key from [Google Cloud Console](https://developers.google.com/maps/documentation/javascript/get-api-key)
4. Add your API key to the `.env` file:
   ```
   GOOGLE_MAPS_API=your_api_key_here
   ```
5. Install dependencies:
   ```
   npm install
   ```
6. Start the game:
   ```
   npm start
   ```
7. Open your browser and go to http://localhost:3000

## How to Play

- **Desktop:** Use arrow keys or WASD to move
- **Mobile:** Drag the poop emoji to move
- Eat food items to grow bigger, faster, and stronger
- Avoid non-edible items which make you smaller, slower, and weaker
- Try to get the highest score and compete on the leaderboard

## Features

- Character movement using keyboard or touch
- Google Maps integration showing your local area
- Food and non-edible items that move around the map
- Score tracking and local leaderboard
- Fun animations and visual effects

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses Google Maps JavaScript API
- Stores leaderboard data in localStorage
- Runs on a simple Express server that injects the API key from environment variables 