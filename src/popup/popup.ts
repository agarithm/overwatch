/// <reference types="chrome"/>

document.addEventListener('DOMContentLoaded', function() {
  const showButton = document.getElementById('showSidebar') as HTMLButtonElement;
  const hideButton = document.getElementById('hideSidebar') as HTMLButtonElement;
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
  const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
  
  async function sendSidebarCommand(action: 'SHOW_SIDEBAR' | 'HIDE_SIDEBAR') {
    try {
      // Get current active tab
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const activeTabId = tabs[0]?.id;
      
      if (!activeTabId) {
        throw new Error('No active tab found');
      }
      
      // Set status message
      statusMessage.textContent = action === 'SHOW_SIDEBAR' ? 'Showing sidebar...' : 'Hiding sidebar...';
      statusMessage.style.color = '#666';
      
      // Send message to content script
      chrome.tabs.sendMessage(activeTabId, { type: action }, (response) => {
        if (chrome.runtime.lastError) {
          // Error occurred
          statusMessage.textContent = 'Error: ' + chrome.runtime.lastError.message;
          statusMessage.style.color = 'red';
          console.error('Error sending command:', chrome.runtime.lastError.message);
          
          // Try injecting content script as fallback
          try {
            chrome.scripting.executeScript({
              target: { tabId: activeTabId },
              files: ['content-script.js']
            }).then(() => {
              chrome.scripting.insertCSS({
                target: { tabId: activeTabId },
                files: ['styles.css']
              }).then(() => {
                // Try again after injection
                chrome.tabs.sendMessage(activeTabId, { type: action }, (secondResponse) => {
                  if (chrome.runtime.lastError) {
                    statusMessage.textContent = 'Still cannot communicate with page';
                    statusMessage.style.color = 'red';
                  } else {
                    statusMessage.textContent = action === 'SHOW_SIDEBAR' ? 'Sidebar shown' : 'Sidebar hidden';
                    statusMessage.style.color = 'green';
                  }
                });
              });
            });
          } catch (err) {
            statusMessage.textContent = 'Cannot access this page';
            statusMessage.style.color = 'red';
          }
        } else {
          // Success
          statusMessage.textContent = action === 'SHOW_SIDEBAR' ? 'Sidebar shown' : 'Sidebar hidden';
          statusMessage.style.color = 'green';
          setTimeout(() => {
            statusMessage.textContent = '';
          }, 2000);
        }
      });
    } catch (error) {
      statusMessage.textContent = 'Error: ' + (error as Error).message;
      statusMessage.style.color = 'red';
    }
  }
  
  // Set up event listeners for the buttons
  if (showButton) {
    showButton.addEventListener('click', () => sendSidebarCommand('SHOW_SIDEBAR'));
  }
  
  if (hideButton) {
    hideButton.addEventListener('click', () => sendSidebarCommand('HIDE_SIDEBAR'));
  }
  
  // Model selection handling
  if (modelSelect) {
    // Load saved model preference
    chrome.storage.sync.get('preferredModel', function(data) {
      if (data.preferredModel) {
        modelSelect.value = data.preferredModel;
      }
    });
    
    // Save model preference when changed
    modelSelect.addEventListener('change', function() {
      statusMessage.textContent = `Model changed to ${modelSelect.value}`;
      statusMessage.style.color = 'blue';
      
      chrome.storage.sync.set({
        preferredModel: modelSelect.value
      });
      
      // Broadcast model change to all tabs
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          const tabId = tab.id;
          if (tabId) {
            chrome.tabs.sendMessage(tabId, {
              type: 'MODEL_CHANGED',
              model: modelSelect.value
            }).catch(() => {
              // Ignore errors for tabs that don't have content script
            });
          }
        });
      });
      
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 2000);
    });
  }
});
