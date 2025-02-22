/// <reference types="chrome"/>

import { ChatSidebar } from './chat-sidebar';
import { Message } from '../shared/types';

let sidebar: ChatSidebar | null = null;

// Initialize the sidebar when the content script loads
function initialize() {
    sidebar = new ChatSidebar();
    document.body.appendChild(sidebar.getContainer());
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message: { type: string; payload: any }) => {
    if (message.type === 'CHAT_RESPONSE') {
        sidebar?.handleResponse(message.payload);
    }
});

// Initialize when the page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}