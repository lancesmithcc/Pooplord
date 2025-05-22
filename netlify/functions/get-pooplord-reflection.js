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

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        console.error('Invalid JSON in request body:', event.body);
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { eatenItems } = requestBody;

    if (!eatenItems || !Array.isArray(eatenItems) || eatenItems.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No eaten items provided.' })
        };
    }

    const prompt = `You are Pooplord, a sentient poop emoji. You just consumed the following items: ${eatenItems.join(', ')}. \n    Reflect on this experience in a single, short, humorous paragraph (around 50-75 words). \n    Use vivid poop and bathroom-related metaphors and language. \n    Keep it lighthearted and absurd. For example, if you ate a pizza, you might say something like: \n    \"Ah, that pizza... a veritable disc of delight, now swirling within my earthy core. It fought valiantly, a cheesy, saucy warrior, but ultimately succumbed to the brown tide. Soon, it shall be... processed... and join the collective. A noble sacrifice to the porcelain throne!\" \n    Be creative and funny.`;

    const deepSeekPayload = {
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: 'You are a helpful assistant embodying the character of Pooplord.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.8,
    };

    console.log('Sending to DeepSeek:', JSON.stringify(deepSeekPayload));

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
        console.log('DeepSeek Response Headers:', JSON.stringify(Object.fromEntries(deepSeekResponse.headers.entries())));

        let responseDataText = await deepSeekResponse.text();
        console.log('DeepSeek Raw Response Body:', responseDataText);

        if (!deepSeekResponse.ok) {
            console.error('DeepSeek API error. Status:', deepSeekResponse.status, 'Body:', responseDataText);
            return {
                statusCode: deepSeekResponse.status,
                body: JSON.stringify({ error: 'Failed to get reflection from DeepSeek.', details: responseDataText })
            };
        }
        
        let responseDataJson;
        try {
            responseDataJson = JSON.parse(responseDataText);
        } catch (parseError) {
            console.error('Failed to parse DeepSeek JSON response:', parseError, 'Raw text:', responseDataText);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to parse DeepSeek response.', details: responseDataText })
            };
        }

        if (responseDataJson.choices && responseDataJson.choices[0] && responseDataJson.choices[0].message && responseDataJson.choices[0].message.content) {
            const reflection = responseDataJson.choices[0].message.content.trim();
            return {
                statusCode: 200,
                body: JSON.stringify({ reflection })
            };
        } else {
            console.error('Unexpected response structure from DeepSeek:', responseDataJson);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to parse reflection from DeepSeek response structure.', details: responseDataJson })
            };
        }

    } catch (error) {
        console.error('Error calling DeepSeek API or processing its response:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error while fetching reflection.', details: error.message })
        };
    }
}; 