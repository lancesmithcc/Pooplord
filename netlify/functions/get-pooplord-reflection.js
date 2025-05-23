const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    console.log('Function called with method:', event.httpMethod);
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // Quick test - return a simple response first
    if (event.body && event.body.includes('"test"')) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reflection: "Test response working!" })
        };
    }

    const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;

    if (!deepSeekApiKey) {
        console.error('DeepSeek API key is missing from environment variables.');
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Server configuration error: DeepSeek API key missing.' })
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
        console.log('Parsed request body:', requestBody);
    } catch (e) {
        console.error('Invalid JSON in request body:', event.body);
        return { 
            statusCode: 400, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid JSON body' }) 
        };
    }

    // Check if this is a level-up reflection request
    const { eatenItems, isLevelUp, level } = requestBody;

    // Handle level-up reflections
    if (isLevelUp) {
        console.log(`Generating level-up reflection for level ${level}`);
        
        // Special level-up prompt
        const levelUpPrompt = `You are Pooplord, a sentient poop emoji who just reached LEVEL ${level} in your game! 
        Generate a paranoid, self-reflective, grandiose comment about your increasing powers and evolution as the lord of poop. 
        Make it about 30-40 words. Use toilet/bathroom humor with a mix of video game power-up references and paranoid delusions of grandeur.
        Example: "LEVEL UP! I can feel the transformation... my fecal matter TRANSCENDING! The world's toilets whisper my name in fear! My excremental essence grows stronger - soon ALL plumbing will recognize me as their overlord! THE SEWERS ARE MINE!"
        Be wild, paranoid, and megalomaniacal about your increasing poop powers.`;
        
        const deepSeekPayload = {
            model: 'deepseek-chat',
            messages: [
                { role: 'user', content: levelUpPrompt }
            ],
            max_tokens: 75,
            temperature: 0.8,
        };
        
        console.log('Sending level-up request to DeepSeek...');
        
        try {
            const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${deepSeekApiKey}`
                },
                body: JSON.stringify(deepSeekPayload)
            });
            
            if (!deepSeekResponse.ok) {
                throw new Error(`DeepSeek API error: ${deepSeekResponse.status}`);
            }
            
            const responseData = await deepSeekResponse.json();
            const reflection = responseData.choices[0].message.content.trim();
            
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reflection })
            };
        } catch (error) {
            console.error('Error generating level-up reflection:', error);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    error: 'Failed to generate level-up reflection',
                    details: error.message
                })
            };
        }
    }

    if (!eatenItems || !Array.isArray(eatenItems) || eatenItems.length === 0) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No eaten items provided.' })
        };
    }

    // Limit items to prevent timeout
    const MAX_ITEMS_FOR_PROMPT = 3; // Reduced from 7 to 3
    let itemsForPrompt = eatenItems.slice(-MAX_ITEMS_FOR_PROMPT); // Always take last few items
    console.log(`Using last ${itemsForPrompt.length} items for prompt:`, itemsForPrompt);

    // Simplified prompt generation
    let prompt = `You are Pooplord, a sentient poop emoji. You just consumed: ${itemsForPrompt.join(', ')}. Give a brief, funny 30-word reflection using poop humor.`;

    // Check for special items and modify prompt slightly
    if (itemsForPrompt.includes('🍄')) {
        prompt = `You are Pooplord after eating mushroom (🍄) and other items ${itemsForPrompt.filter(item => item !== '🍄').join(', ')}. Give a brief 30-word cosmic/conspiracy reflection with poop humor.`;
    } else if (itemsForPrompt.includes('🛸')) {
        prompt = `You are Pooplord after UFO abduction (🛸) and eating ${itemsForPrompt.filter(item => item !== '🛸').join(', ')}. Give a brief 30-word paranoid reflection with poop humor.`;
    } else if (itemsForPrompt.includes('🐒')) {
        prompt = `You are Pooplord after eating monkey (🐒) and ${itemsForPrompt.filter(item => item !== '🐒').join(', ')}. Give a brief 30-word silly monkey reflection with poop humor.`;
    } else if (itemsForPrompt.includes('💸')) {
        prompt = `You are Pooplord after consuming money (💸) and ${itemsForPrompt.filter(item => item !== '💸').join(', ')}. Give a brief 30-word materialistic reflection with poop humor.`;
    }

    const deepSeekPayload = {
        model: 'deepseek-chat',
        messages: [
            { role: 'user', content: prompt }
        ],
        max_tokens: 60, // Reduced from 150
        temperature: 0.7, // Reduced from 0.8
    };

    console.log('Sending simplified request to DeepSeek...');

    try {
        const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepSeekApiKey}`
            },
            body: JSON.stringify(deepSeekPayload)
        });

        console.log('DeepSeek Response Status:', deepSeekResponse.status);

        if (!deepSeekResponse.ok) {
            console.error('DeepSeek API error. Status:', deepSeekResponse.status);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Failed to get reflection from DeepSeek.' })
            };
        }
        
        const responseDataJson = await deepSeekResponse.json();
        console.log('DeepSeek response received');

        if (responseDataJson.choices && responseDataJson.choices[0] && responseDataJson.choices[0].message && responseDataJson.choices[0].message.content) {
            const reflection = responseDataJson.choices[0].message.content.trim();
            console.log('Returning reflection:', reflection);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reflection })
            };
        } else {
            console.error('Unexpected response structure from DeepSeek');
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Failed to parse reflection from DeepSeek response.' })
            };
        }

    } catch (error) {
        console.error('Error calling DeepSeek API:', error.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error while fetching reflection.', details: error.message })
        };
    }
}; 