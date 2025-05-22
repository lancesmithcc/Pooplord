const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;

    if (!deepSeekApiKey) {
        console.error('DeepSeek API key is missing from environment variables.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: DeepSeek API key missing.' })
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { eatenItems } = body;

    if (!eatenItems || !Array.isArray(eatenItems) || eatenItems.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No eaten items provided.' })
        };
    }

    const prompt = `You are Pooplord, a sentient poop emoji. You just consumed the following items: ${eatenItems.join(', ')}. \n    Reflect on this experience in a single, short, humorous paragraph (around 50-75 words). \n    Use vivid poop and bathroom-related metaphors and language. \n    Keep it lighthearted and absurd. For example, if you ate a pizza, you might say something like: \n    \"Ah, that pizza... a veritable disc of delight, now swirling within my earthy core. It fought valiantly, a cheesy, saucy warrior, but ultimately succumbed to the brown tide. Soon, it shall be... processed... and join the collective. A noble sacrifice to the porcelain throne!\" \n    Be creative and funny.`;

    try {
        const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepSeekApiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant embodying the character of Pooplord.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150,
                temperature: 0.8,
            })
        });

        const responseData = await deepSeekResponse.json();

        if (!deepSeekResponse.ok) {
            console.error('DeepSeek API error:', deepSeekResponse.status, responseData);
            return {
                statusCode: deepSeekResponse.status,
                body: JSON.stringify({ error: 'Failed to get reflection from DeepSeek.', details: responseData })
            };
        }
        
        if (responseData.choices && responseData.choices[0] && responseData.choices[0].message && responseData.choices[0].message.content) {
            const reflection = responseData.choices[0].message.content.trim();
            return {
                statusCode: 200,
                body: JSON.stringify({ reflection })
            };
        } else {
            console.error('Unexpected response structure from DeepSeek:', responseData);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to parse reflection from DeepSeek response.' })
            };
        }

    } catch (error) {
        console.error('Error calling DeepSeek API:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error while fetching reflection.' })
        };
    }
}; 