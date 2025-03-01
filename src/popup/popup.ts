/// <reference types="chrome"/>

document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleSidebar') as HTMLButtonElement;
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
  const statusMessage = document.createElement('div');
  statusMessage.className = 'status-message';
  document.querySelector('.popup-container')?.appendChild(statusMessage);
  
  if (toggleButton) {
    toggleButton.addEventListener('click', async function() {
      statusMessage.textContent = 'Toggling sidebar...';
      statusMessage.style.color = '#666';
      
      // Get the active tab and send a message to toggle the sidebar
      try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        const activeTabId = tabs[0]?.id;
        
        if (!activeTabId) {
          throw new Error('No active tab found');
        }
        
        // First ensure the content script is injected
        try {
          await chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            func: () => {
              // Just checking if we can execute in the tab
              return true;
            }
          });
        } catch (e) {
          console.log('Tab not accessible for script injection, using message only');
        }
        
        // Now try to send the message
        chrome.tabs.sendMessage(activeTabId, {
          type: 'TOGGLE_SIDEBAR'
        }, (response) => {
          if (chrome.runtime.lastError) {
            statusMessage.textContent = 'Error: ' + chrome.runtime.lastError.message;
            statusMessage.style.color = 'red';
            console.error('Error toggling sidebar:', chrome.runtime.lastError.message);
            
            // Try to inject content script as fallback
            chrome.scripting.executeScript({
              target: { tabId: activeTabId },
              files: ['content-script.js']
            }).then(() => {
              statusMessage.textContent = 'Injected content script, try again';
              statusMessage.style.color = 'blue';
            }).catch(err => {
              statusMessage.textContent = 'Cannot access page: ' + err.message;
              statusMessage.style.color = 'red';
            });
          } else {
            statusMessage.textContent = 'Sidebar toggled';
            statusMessage.style.color = 'green';
            console.log('Toggle sidebar response:', response);
            setTimeout(() => {
              statusMessage.textContent = '';
            }, 2000);
          }
        });
      } catch (error) {
        statusMessage.textContent = 'Error: ' + (error as Error).message;
        statusMessage.style.color = 'red';
        console.error('Error in toggle action:', error);
      }
    });
  }
  
  if (modelSelect) {
    // Load saved model preference
    chrome.storage.sync.get('preferredModel', function(data) {
      if (data.preferredModel) {
        modelSelect.value = data.preferredModel;
      }
    });
    
    // Save model preference when changed
    modelSelect.addEventListener('change', function() {
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
            }).catch((err) => {
              // Ignore errors for tabs that don't have content script
              console.log('Could not send model change to tab:', tabId, err);
            });
          }
        });
      });
    });
  }
});
