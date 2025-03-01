/// <reference types="chrome"/>

interface ChatMessage {
  type: string;
  payload: {
    message: string;
    pageContent: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
}

interface OllamaResponse {
  message: string;
}

chrome.runtime.onMessage.addListener((
  message: ChatMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  if (message.type === 'CHAT_MESSAGE') {
    handleChatMessage(message.payload, sender);
  }
});

async function handleChatMessage(
  payload: ChatMessage['payload'],
  sender: chrome.runtime.MessageSender
) {
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
            content: `You are a helpful AI assistant. Context from the current webpage: ${payload.pageContent}`
          },
          ...payload.history
        ]
      })
    });

    const data: OllamaResponse = await response.json();
    
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'CHAT_RESPONSE',
        payload: data.message
      });
    }
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
  }
}