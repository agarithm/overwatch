/// <reference types="chrome"/>

import { ChatSidebar } from './chat-sidebar';
import '../styles/sidebar.css';

// Use a global variable to track if we've already initialized
const OVERWATCH_INITIALIZED = '__OVERWATCH_INITIALIZED__';

// Add global keyboard shortcut listener with focus detection
function setupKeyboardShortcuts(sidebar: ChatSidebar) {
  document.addEventListener('keydown', (e) => {
    // Only respond if this window/document is focused
    if (!document.hasFocus()) {
      return;
    }
    
    // Alt+W (or Option+W on Mac) to toggle sidebar
    if (e.altKey && (e.key === 'w' || e.key === 'W')) {
      console.log('Hotkey detected: Alt+W');
      
      // Stop event propagation
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle the sidebar with explicit check and immediate action
      if (sidebar.isVisible()) {
        console.log('Hotkey action: hiding sidebar');
        sidebar.hide();
      } else {
        console.log('Hotkey action: showing sidebar');
        sidebar.show();
      }
    }
  }, true); // Use capturing phase for earliest interception
  
  console.log('Keyboard shortcuts initialized (Alt+W to toggle sidebar)');
}

// Check if already initialized
if (!(window as any)[OVERWATCH_INITIALIZED]) {
  console.log('Initializing Overwatch extension');
  (window as any)[OVERWATCH_INITIALIZED] = true;

  let sidebar: ChatSidebar | null = null;

  // Initialize the sidebar when the content script loads
  function initialize() {
    if (!sidebar) {
      console.log('Creating sidebar instance');
      sidebar = new ChatSidebar();
      document.body.appendChild(sidebar.getContainer());
      console.log('Sidebar container added to DOM');
      
      // Set up keyboard shortcuts with a small delay to ensure sidebar is ready
      setTimeout(() => {
        if (sidebar) {
          setupKeyboardShortcuts(sidebar);
        }
      }, 100);
      
      // Add window resize listener
      window.addEventListener('resize', () => {
        // Use the method correctly with parentheses
        if (sidebar && sidebar.isVisible()) {
          sidebar.applyConstraints();
        }
      });
    } else {
      console.log('Sidebar already initialized');
    }
    return sidebar;
  }

  // Listen for messages from the popup or background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request.type, 'Source:', request.source || 'unknown');
    
    // Make sure sidebar is initialized for any operation
    if (!sidebar) {
      sidebar = initialize();
    }

    // Handle toggle command which should override show/hide
    if (request.type === 'TOGGLE_SIDEBAR') {
      console.log('Toggle sidebar message received');
      if (sidebar) {
        // Use promise pattern with proper error handling
        sidebar.toggle()
          .then(() => {
            sendResponse({
              success: true, 
              action: 'toggled', 
              nowVisible: sidebar!.isVisible()
            });
          })
          .catch(err => {
            console.error('Error in toggle action:', err);
            sendResponse({
              success: false, 
              error: 'Toggle action failed'
            });
          });
      } else {
        console.error('Failed to initialize sidebar');
        sendResponse({
          success: false, 
          error: 'Failed to initialize sidebar'
        });
      }
    } else if (request.type === 'SHOW_SIDEBAR') {
      console.log('Show sidebar message received');
      if (sidebar) {
        sidebar.show()
          .then(() => {
            sendResponse({success: true, action: 'shown'});
          })
          .catch(err => {
            console.error('Error showing sidebar:', err);
            sendResponse({success: false, error: err.message});
          });
      } else {
        console.error('Failed to initialize sidebar');
        sendResponse({success: false, error: 'Failed to initialize sidebar'});
      }
    } else if (request.type === 'HIDE_SIDEBAR') {
      console.log('Hide sidebar message received');
      if (sidebar) {
        sidebar.hide();
        sendResponse({success: true, action: 'hidden'});
      } else {
        console.error('Failed to initialize sidebar');
        sendResponse({success: false, error: 'Failed to initialize sidebar'});
      }
    } else if (request.type === 'CHAT_RESPONSE') {
      if (sidebar) {
        sidebar.handleResponse(request.payload);
        sendResponse({success: true});
      } else {
        console.error('Sidebar not initialized for chat response');
        sendResponse({success: false, error: 'Sidebar not initialized'});
      }
    } else if (request.type === 'MODEL_CHANGED') {
      if (sidebar) {
        sidebar.updateModel(request.model);
        sendResponse({success: true});
      } else {
        sendResponse({success: false});
      }
    }
    
    // Return true to indicate we want to send a response asynchronously
    return true;
  });

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // Already loaded, initialize now
    initialize();
  }
  
  console.log('Overwatch content script setup complete');
}