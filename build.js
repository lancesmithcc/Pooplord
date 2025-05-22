const fs = require('fs');
const path = require('path');

// Get API key from environment
const apiKey = process.env.GOOGLE_MAPS_API || '';

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Replace the placeholder with the actual API key
htmlContent = htmlContent.replace(
  /<script async\s+src="https:\/\/maps\.googleapis\.com\/maps\/api\/js\?key=YOUR_API_KEY&libraries=geometry,directions&callback=initMap">/g,
  `<script async src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,directions&callback=initMap">`
);

// Write the modified content back to index.html
fs.writeFileSync(indexPath, htmlContent);

console.log('Build completed: API key injected into index.html'); 