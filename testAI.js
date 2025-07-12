// No direct import needed for a client library like 'openai' for the fetch API approach.
// We will use a direct fetch call to the Gemini API endpoint.

// Your API key will be automatically provided by the Canvas environment.
// Leave it as an empty string here.
const apiKey = ""; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;


// The chat history format for Gemini API
let chatHistory = [
    {
        role: 'user', // System messages are typically handled by the prompt itself or initial user message for Gemini.
        parts: [{ text: 'You are a helpful general knowledge expert. Who invented the television?' }]
    }
];

// If you want a more conversational turn-based chat, you would structure it like this:
// let chatHistory = [
//     { role: 'user', parts: [{ text: 'You are a helpful general knowledge expert.' }] },
//     { role: 'model', parts: [{ text: 'Understood. How can I assist you with general knowledge?' }] }, // Example model response
//     { role: 'user', parts: [{ text: 'Who invented the television?' }] }
// ];


async function getGeminiResponse() {
    try {
        const payload = {
            contents: chatHistory,
            // You can add generationConfig for specific settings like temperature, topP, topK
            // generationConfig: {
            //     temperature: 0.7,
            //     topP: 0.95,
            //     topK: 64,
            //     maxOutputTokens: 8192,
            //     responseMimeType: "text/plain",
            // },
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // Check if the response structure is as expected
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            console.log(text);
        } else {
            console.error("Unexpected response structure from Gemini API:", result);
            console.log("No content found in the response.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
    }
}

getGeminiResponse();
