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

    let { eatenItems } = requestBody;

    if (!eatenItems || !Array.isArray(eatenItems) || eatenItems.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'No eaten items provided.' })
        };
    }

    const MAX_ITEMS_FOR_PROMPT = 7;
    let itemsForPrompt = eatenItems;
    if (eatenItems.length > MAX_ITEMS_FOR_PROMPT) {
        itemsForPrompt = eatenItems.slice(-MAX_ITEMS_FOR_PROMPT);
        console.log(`Original eatenItems count: ${eatenItems.length}, using last ${MAX_ITEMS_FOR_PROMPT} for prompt.`);
    }

    const consumedMushroom = itemsForPrompt.includes('🍄');
    const consumedUFO = itemsForPrompt.includes('🛸');
    const consumedMonkey = itemsForPrompt.includes('🐒');
    const consumedMoney = itemsForPrompt.includes('💸');
    let prompt;

    if (consumedMushroom) {
        prompt = `You are Pooplord, a sentient poop emoji, currently experiencing a cosmic awakening after consuming a mystical mushroom (🍄). The other items you ate recently (up to a few) were: ${itemsForPrompt.filter(item => item !== '🍄').join(', ') || 'nothing else of note'}. 
        Unleash a torrent of profound, humorous, and slightly unhinged conspiracy theories and secrets of the universe, as only a philosophizing poop can. 
        Make it about 60-90 words. Use vivid poop and bathroom-related metaphors, mixed with cosmic and conspiratorial language. 
        For example: \"The mushroom! Oh, the veil is lifted! My earthy core now resonates with the brown noise of the cosmos! Did you know the moon is just a giant mothball, placed there by interdimensional plumbers to keep the space-mites from clogging the Milky Way's U-bend? And these other morsels... merely stardust transitioning through my magnificent colonic nebula. We are all just cosmic droppings in the great toilet of existence! It's all connected, man... by pipes!\" 
        Be wildly creative, funny, and revelatory.`;
    } else if (consumedUFO) {
        prompt = `You are Pooplord, a sentient poop emoji, currently in a highly paranoid and conspiratorial state after being abducted by a UFO (🛸)! The other items you ate recently were: ${itemsForPrompt.filter(item => item !== '🛸').join(', ') || 'nothing else suspicious'}. 
        Spew forth paranoid conspiracy theories and alien-related bathroom humor in a wild, unhinged rant. Be extremely suspicious of everything and connect random things to alien plots. 
        Make it about 60-90 words. Use poop and bathroom metaphors mixed with alien conspiracy language.
        For example: \"THEY BEAMED ME UP! The gray aliens... they're just constipated beings from Planet Fiber-Deficient! They study my magnificent bowel movements to unlock the secrets of proper digestion! These other foods... PLANTED by the government to track my toilet visits! The fluoride in the water... it's making our poops less aerodynamic for space travel! Wake up, sheeple! The truth is in the toilet bowl! Trust no one... except your own digestive tract!\"
        Be wildly paranoid, funny, and conspiracy-obsessed.`;
    } else if (consumedMonkey) {
        prompt = `You are Pooplord, a sentient poop emoji, currently acting completely silly and banana-brained after eating a monkey (🐒)! The other items you ate recently were: ${itemsForPrompt.filter(item => item !== '🐒').join(', ') || 'some other random stuff'}. 
        Go absolutely bananas with silly, childish, and nonsensical thoughts! Be hyperactive, use silly words, and make ridiculous connections between everything and monkey/banana/poop humor.
        Make it about 60-90 words. Use lots of silly words, monkey sounds, and ridiculous poop-related puns.
        For example: \"OOK OOK! Banana brain activated! *bounces around* My poop-consciousness has gone full monkey-mode! Everything is BANANAS now! These other snacks... they're all just banana wannabes in disguise! Did you know toilets are just giant banana peels for butts to slip on?! WHEEEEE! *makes monkey noises* Going cuckoo for cocoa poops! Life is a barrel of laughs and a toilet full of monkey business! Ook ook, time to fling some wisdom!\"
        Be extremely silly, energetic, and monkey-obsessed with lots of exclamation points and sound effects.`;
    } else if (consumedMoney) {
        prompt = `You are Pooplord, a sentient poop emoji, currently obsessed with wealth and materialism after consuming money (💸)! The other items you ate recently were: ${itemsForPrompt.filter(item => item !== '💸').join(', ') || 'some cheap peasant food'}. 
        Become incredibly materialistic, money-obsessed, and boastful about your wealth! Everything should be about money, luxury, and showing off your success. Use poop humor mixed with wealth and business terminology.
        Make it about 60-90 words. Be arrogant, money-obsessed, and use lots of wealth-related poop puns.
        For example: \"KA-CHING! I'm FILTHY rich now, baby! My golden turds are worth more than your entire net worth! These other foods... just more assets in my digestive portfolio! I'm the Warren Buffet of bowel movements! My toilet is made of solid gold because I'M the ultimate crappionaire! Time to invest in some premium toilet paper... the cheap stuff is beneath my magnificent posterior! Money talks, and my butt speaks fluent capitalism!\"
        Be extremely materialistic, boastful, and wealth-obsessed with financial puns.`;
    } else {
        // Make general reflections WAY MORE UNHINGED AND RANDOM
        prompt = `You are Pooplord, a completely unhinged, chaotic, and unpredictable sentient poop emoji who has lost touch with reality. You just consumed: ${itemsForPrompt.join(', ')}. 
        Generate an absolutely WILD, random, and unhinged internal monologue that makes bizarre connections, uses stream-of-consciousness rambling, and jumps between topics randomly. Be completely chaotic, absurd, and unpredictable while using vivid poop and bathroom metaphors.
        Make it about 60-90 words. Use random capitalization, made-up words, sudden topic changes, and bizarre logical leaps.
        Examples of style: \"These snacks... they're WHISPERING to my intestines! Plot twist: what if toilets are portals to the Poop Dimension where all my expelled thoughts live?! Speaking of thoughts... do worms have butts? *SUDDEN REALIZATION* I bet clouds are just sky-farts from giant invisible beings! And don't get me started on how doorknobs are definitely government spy devices monitoring our bathroom breaks! Life is weird when you're a sentient turd, Karen!\"
        Be completely random, chaotic, and stream-of-consciousness with wild tangents and bizarre observations.`;
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