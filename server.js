require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // For making API calls to DeepSeek

const app = express();
const PORT = process.env.PORT || 3000;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API || '';
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY || '';

app.use(express.json()); // Middleware to parse JSON request bodies

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
            /<script async\s+src="https:\/\/maps\.googleapis\.com\/maps\/api\/js\?key=YOUR_API_KEY&libraries=geometry,directions&callback=initMap">/g, 
            `<script async src="https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry,directions&callback=initMap">`
        );
        
        res.send(modifiedHtml);
    });
});

// New endpoint for DeepSeek reflections
app.post('/get-pooplord-reflection', async (req, res) => {
    if (!deepSeekApiKey) {
        console.error('DeepSeek API key is missing.');
        return res.status(500).json({ error: 'Server configuration error: DeepSeek API key missing.' });
    }

    const { eatenItems } = req.body; // Expect an array of item names or descriptions

    if (!eatenItems || !Array.isArray(eatenItems) || eatenItems.length === 0) {
        return res.status(400).json({ error: 'No eaten items provided.' });
    }

    const prompt = `You are Pooplord, a sentient poop emoji. You just consumed the following items: ${eatenItems.join(', ')}. 
    Reflect on this experience in a single, short, humorous paragraph (around 50-75 words). 
    Use vivid poop and bathroom-related metaphors and language. 
    Keep it lighthearted and absurd. For example, if you ate a pizza, you might say something like: 
    "Ah, that pizza... a veritable disc of delight, now swirling within my earthy core. It fought valiantly, a cheesy, saucy warrior, but ultimately succumbed to the brown tide. Soon, it shall be... processed... and join the collective. A noble sacrifice to the porcelain throne!" 
    Be creative and funny.`;

    try {
        const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepSeekApiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat', // Or the specific model you intend to use
                messages: [
                    { role: 'system', content: 'You are a helpful assistant embodying the character of Pooplord.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150, // Adjust as needed for paragraph length
                temperature: 0.8, // Adjust for creativity
            })
        });

        if (!deepSeekResponse.ok) {
            const errorData = await deepSeekResponse.json();
            console.error('DeepSeek API error:', deepSeekResponse.status, errorData);
            return res.status(deepSeekResponse.status).json({ error: 'Failed to get reflection from DeepSeek.', details: errorData });
        }

        const data = await deepSeekResponse.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            const reflection = data.choices[0].message.content.trim();
            res.json({ reflection });
        } else {
            console.error('Unexpected response structure from DeepSeek:', data);
            res.status(500).json({ error: 'Failed to parse reflection from DeepSeek response.' });
        }

    } catch (error) {
        console.error('Error calling DeepSeek API:', error);
        res.status(500).json({ error: 'Internal server error while fetching reflection.' });
    }
});

// Serve static files from the current directory
app.use(express.static('./'));

app.listen(PORT, () => {
    console.log(`Pooplord server running on http://localhost:${PORT}`);
    console.log(`Google Maps API Key status: ${googleMapsApiKey ? 'Loaded from .env' : 'NOT FOUND - Please check your .env file'}`);
    console.log(`DeepSeek API Key status: ${deepSeekApiKey ? 'Loaded from .env' : 'NOT FOUND - Please check your .env file'}`);
    
    // Print a warning if the Google Maps API key is missing or empty
    if (!googleMapsApiKey) {
        console.warn('\x1b[31m%s\x1b[0m', 'WARNING: No Google Maps API key found in .env file!');
        console.warn('\x1b[31m%s\x1b[0m', 'Create a .env file with GOOGLE_MAPS_API=your_key_here');
    }
    // Print a warning if the DeepSeek API key is missing or empty
    if (!deepSeekApiKey) {
        console.warn('\x1b[31m%s\x1b[0m', 'WARNING: No DeepSeek API key found in .env file!');
        console.warn('\x1b[31m%s\x1b[0m', 'Create a .env file with DEEPSEEK_API_KEY=your_key_here');
    }
}); 