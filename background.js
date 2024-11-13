const apiKey = "YOUR_OPENAI_API_KEY";

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "QUESTION_DETAILS") {
        const { question, type, options } = message.payload;

        // Prepare the prompt for ChatGPT
        const prompt = `Question: ${question}\nType: ${type}\nOptions:\n${options.join('\n')}\n\nPlease provide the best answer.`;

        try {
            const answer = await askChatGPT(prompt);
            // Send the answer back to the content script
            chrome.tabs.sendMessage(sender.tab.id, { type: "ANSWER", answer });
        } catch (error) {
            console.error("Error getting answer from ChatGPT:", error);
        }
    }
});

// Function to query ChatGPT API
async function askChatGPT(prompt) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }]
        })
    });

    if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
    } else {
        throw new Error(`ChatGPT API error: ${response.status}`);
    }
}
