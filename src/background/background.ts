/// <reference types="chrome"/>

interface ChatMessage {
  type: string;
  payload: {
    message: string;
    pageContent: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    model?: string;
  };
}

interface OllamaResponse {
  message: string;
}

chrome.runtime.onMessage.addListener((
  message: any, // Use any type to avoid TypeScript errors with message format
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  if (message.type === 'CHAT_MESSAGE') {
    handleChatMessage(message.payload, sender);
  }
  return true; // Keep the message channel open for async response
});

// Add a listener for when a tab is updated to ensure content script is there
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only run when the page is fully loaded
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    try {
      // Re-inject the content script to ensure it's available
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["content-script.js"]
      }).catch(err => console.log('Script injection not needed or failed:', err));
      
      // Also inject the CSS
      chrome.scripting.insertCSS({
        target: { tabId },
        files: ["styles.css"]
      }).catch(err => console.log('CSS injection not needed or failed:', err));
    } catch (error) {
      console.error('Error injecting content script:', error);
    }
  }
});

// Listen for keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-sidebar') {
    try {
      // Get the active tab in the currently focused window
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (!activeTab || !activeTab.id) {
        console.error('No active tab found to toggle sidebar');
        return;
      }
      
      console.log('Command received, toggling sidebar on active tab:', activeTab.id);
      
      // Ensure the content script is loaded before trying to send the message
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          return true;
        }
      }).catch(err => {
        console.error('Cannot inject script in this tab:', err);
        throw err;
      });
      
      // Now send the toggle command
      await chrome.tabs.sendMessage(activeTab.id, { 
        type: 'TOGGLE_SIDEBAR',
        source: 'command'
      }).catch(err => {
        console.error('Error toggling sidebar:', err);
      });
    } catch (error) {
      console.error('Failed to handle toggle command:', error);
    }
  }
});

// Improved extension action click handler with better error handling
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked, tab:', tab);
  
  if (!tab.id) {
    console.error('No tab ID available');
    return;
  }
  
  try {
    console.log('Attempting to send TOGGLE_SIDEBAR message to tab', tab.id);
    
    // First ensure scripts are injected (in case content script wasn't loaded)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        console.log('Injection verification script running');
        // This just confirms we can execute in the tab
      }
    });
    
    // Now send the toggle message
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError.message);
      } else {
        console.log('Toggle message sent successfully, response:', response);
      }
    });
  } catch (error) {
    console.error('Failed to execute script or send message:', error);
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
        model: payload.model || 'mistral',
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