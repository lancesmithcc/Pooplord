require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.GOOGLE_MAPS_API || '';

// Serve the index.html with API key injected
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Error loading page');
        }
        
        // Replace the API key in the Google Maps script tag
        // This handles the multi-line script tag format
        const modifiedHtml = data.replace(
            /src="https:\/\/maps\.googleapis\.com\/maps\/api\/js\?key=YOUR_API_KEY&callback=initMap">/g, 
            `src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap">`
        );
        
        res.send(modifiedHtml);
    });
});

// Serve static files from the current directory
app.use(express.static('./'));

app.listen(PORT, () => {
    console.log(`Pooplord server running on http://localhost:${PORT}`);
    console.log(`API Key status: ${apiKey ? 'Loaded from .env' : 'NOT FOUND - Please check your .env file'}`);
    
    // Print a warning if the API key is missing or empty
    if (!apiKey) {
        console.error('\x1b[31m%s\x1b[0m', 'WARNING: No Google Maps API key found in .env file!');
        console.error('\x1b[31m%s\x1b[0m', 'Create a .env file with GOOGLE_MAPS_API=your_key_here');
    }
}); 