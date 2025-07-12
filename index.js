import { dates } from './utils/dates.js'

const apiKeyPolygon = ''
const apiKeyGemini = ""
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyGemini}`;



const tickersArr = []

const generateReportBtn = document.querySelector('.generate-report-btn')

generateReportBtn.addEventListener('click', fetchStockData)

document.getElementById('ticker-input-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const tickerInput = document.getElementById('ticker-input')
    if (tickerInput.value.length > 2) {
        generateReportBtn.disabled = false
        const newTickerStr = tickerInput.value
        tickersArr.push(newTickerStr.toUpperCase())
        tickerInput.value = ''
        renderTickers()
    } else {
        const label = document.getElementsByTagName('label')[0]
        label.style.color = 'red'
        label.textContent = 'You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla.'
    }
})

function renderTickers() {
    const tickersDiv = document.querySelector('.ticker-choice-display')
    tickersDiv.innerHTML = ''
    tickersArr.forEach((ticker) => {
        const newTickerSpan = document.createElement('span')
        newTickerSpan.textContent = ticker
        newTickerSpan.classList.add('ticker')
        tickersDiv.appendChild(newTickerSpan)
    })
}

const loadingArea = document.querySelector('.loading-panel')
const apiMessage = document.getElementById('api-message')
const outputArea = document.querySelector('.output-panel')
// Ensure there's a <p> tag inside .output-panel in your HTML for this to work
const reportParagraph = document.querySelector('.output-panel p') 


async function fetchStockData() {
    document.querySelector('.action-panel').style.display = 'none'
    loadingArea.style.display = 'flex'
    apiMessage.innerText = 'Fetching stock data...' // Update message
    outputArea.style.display = 'none'; // Hide previous report if any

    try {
        const stockDataPromises = tickersArr.map(async (ticker) => {
            // Use apiKeyPolygon for Polygon.io API
            const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${apiKeyPolygon}`
            const response = await fetch(url)
            
            if (!response.ok) { // Check for HTTP errors (e.g., 401, 404)
                const errorText = await response.text();
                throw new Error(`Failed to fetch data for ${ticker}: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json(); // Parse as JSON, not text
            return data; // Return the parsed JSON data
        });

        const allStockData = await Promise.all(stockDataPromises);
        
        // Filter out any potential null/undefined results from failed fetches if not throwing
        const validStockData = allStockData.filter(data => data); 

        if (validStockData.length === 0) {
            loadingArea.innerText = 'No valid stock data fetched. Please check tickers and API key.';
            return;
        }

        apiMessage.innerText = 'Creating report...';
        // Convert the stock data objects to a string format suitable for the LLM
        // This ensures the LLM receives readable data
        const stockDataString = validStockData.map(data => JSON.stringify(data, null, 2)).join('\n\n');
        
        // Pass the fetched stock data string to the Gemini function
        await getGeminiResponse(stockDataString);

    } catch(err) {
        loadingArea.innerText = `Error fetching stock data: ${err.message}`;
        console.error('Error in fetchStockData: ', err);
    }
}

// getGeminiResponse now accepts 'stockData' as a parameter
async function getGeminiResponse(stockData) {
    try {
        // Construct the chat history with the stock data
        // The 'stockData' is now dynamically added to the user's prompt
        const chatHistory = [
            {
                role: 'user',
                parts: [
                    { text: 'You are a helpful general knowledge expert and a financial analyst. Analyze the following stock data and generate a report advising on whether to buy, sell, or hold the shares based on the past three days of data. Provide a clear recommendation and a brief explanation.' },
                    { text: `Stock Data:\n${stockData}` } // Include the stock data here
                ]
            }
        ];

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
            renderReport(text); // Render the report once received
        } else {
            console.error("Unexpected response structure from Gemini API:", result);
            renderReport("Error: Could not generate report. Unexpected response from AI.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        renderReport(`Error generating report: ${error.message}`);
    }
}



function renderReport(output) {
    loadingArea.style.display = 'none'
    outputArea.style.display = 'flex'
    // Ensure reportParagraph is correctly selected and exists in HTML
    if (reportParagraph) {
        reportParagraph.textContent = output // Update the content of the existing <p> tag
    } else {
        // Fallback if <p> tag is not found, though it's better to ensure it exists in HTML
        const newReport = document.createElement('p');
        newReport.textContent = output;
        outputArea.appendChild(newReport);
    }
}