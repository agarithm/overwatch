/// <reference types="chrome"/>

import { ChatSidebar } from './chat-sidebar';
import '../styles/sidebar.css';

// Use a global variable to track if we've already initialized
const OVERWATCH_INITIALIZED = '__OVERWATCH_INITIALIZED__';

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
    } else {
      console.log('Sidebar already initialized');
    }
  }

  // Listen for messages from the popup or background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request.type);
    
    if (request.type === 'TOGGLE_SIDEBAR') {
      console.log('Toggle sidebar message received');
      
      // Initialize if not already done
      if (!sidebar) {
        initialize();
      }
      
      if (sidebar) {
        sidebar.toggle();
        sendResponse({success: true});
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