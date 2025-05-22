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

    const consumedMushroom = eatenItems.includes('🍄');
    let prompt;

    if (consumedMushroom) {
        prompt = `You are Pooplord, a sentient poop emoji, currently experiencing a cosmic awakening after consuming a mystical mushroom (🍄). The other items you ate recently were: ${eatenItems.filter(item => item !== '🍄').join(', ') || 'nothing else of note'}. 
        Unleash a torrent of profound, humorous, and slightly unhinged conspiracy theories and secrets of the universe, as only a philosophizing poop can. 
        Make it about 60-90 words. Use vivid poop and bathroom-related metaphors, mixed with cosmic and conspiratorial language. 
        For example: \"The mushroom! Oh, the veil is lifted! My earthy core now resonates with the brown noise of the cosmos! Did you know the moon is just a giant mothball, placed there by interdimensional plumbers to keep the space-mites from clogging the Milky Way's U-bend? And these other morsels... merely stardust transitioning through my magnificent colonic nebula. We are all just cosmic droppings in the great toilet of existence! It's all connected, man... by pipes!\" 
        Be wildly creative, funny, and revelatory.`;
    } else {
        prompt = `You are Pooplord, a sentient poop emoji, prone to existential musings. You just consumed the following items: ${eatenItems.join(', ')}. 
    Reflect on this experience in a single, short, humorous paragraph (around 60-80 words). 
    Ponder your existence, sentience, and the cycle of consumption, all while using vivid poop and bathroom-related metaphors. 
    Keep it lighthearted, absurd, and slightly philosophical. For example, if you ate a burger, you might muse: 
    \"This burger... a fleeting symphony of sesame and beef, now assimilated into my... being. Does it question its fate? Do I question mine? To roll, to consume, to... become one with the great flush. Is this all there is to a Pooplord's life? Perhaps the porcelain oracle holds the answers, or maybe it's just a place to unload. The mystery continues, one digested morsel at a time.\" 
    Be creative, funny, and deeply, hilariously introspective.`;
    }

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