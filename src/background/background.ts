/// <reference types="chrome"/>

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_MESSAGE') {
    handleChatMessage(message.payload);
  }
});

async function handleChatMessage({ message, pageContent, history }) {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant. Context from the current webpage: ${pageContent}`
          },
          ...history
        ]
      })
    });

    const data = await response.json();
    // Send response back to content script
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'CHAT_RESPONSE',
      payload: data.message
    });
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
  }
}