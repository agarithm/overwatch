/// <reference types="chrome"/>

export class ChatSidebar {
  private container: HTMLDivElement;
  private resizer: HTMLDivElement;
  private chatHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
  private _isVisible: boolean = false;
  private currentModel: string = 'mistral';
  private defaultWidth: number = 300; // Default width in pixels
  private currentHost: string = '';
  private siteSettings: Record<string, { 
    width: number;
    chatHistory?: Array<{role: 'user' | 'assistant', content: string}>;
  }> = {};

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'overwatch-sidebar';
    
    // Create resizer element
    this.resizer = document.createElement('div');
    this.resizer.className = 'sidebar-resizer';
    
    // Store current host
    this.currentHost = window.location.hostname || 'default';
    
    // Get stored size settings and chat history
    this.loadSiteSettings();
    
    this.initializeSidebar();
    this.setupResizer();
    
    // Initialize with proper width (from storage or default)
    this.applyInitialWidth();
    
    // Make sure the sidebar is initially hidden
    this.container.style.right = '-9999px'; // Hide off-screen initially
  }

  private async loadSiteSettings() {
    try {
      const result = await chrome.storage.local.get('sidebarSiteSettings');
      if (result.sidebarSiteSettings) {
        this.siteSettings = result.sidebarSiteSettings;
        console.log('Loaded site settings:', this.siteSettings);
        
        // Load chat history for this site
        if (this.siteSettings[this.currentHost]?.chatHistory) {
          this.chatHistory = this.siteSettings[this.currentHost].chatHistory || [];
          console.log(`Loaded ${this.chatHistory.length} chat messages for ${this.currentHost}`);
        }
      }
    } catch (e) {
      console.error('Error loading sidebar settings:', e);
      this.siteSettings = {};
    }
  }

  private async saveSiteSettings() {
    try {
      // Ensure we have an entry for the current host
      if (!this.siteSettings[this.currentHost]) {
        this.siteSettings[this.currentHost] = { width: this.defaultWidth };
      }
      
      // Update chat history in settings
      this.siteSettings[this.currentHost].chatHistory = this.chatHistory;
      
      await chrome.storage.local.set({ 'sidebarSiteSettings': this.siteSettings });
      console.log('Saved site settings with chat history');
    } catch (e) {
      console.error('Error saving sidebar settings:', e);
    }
  }

  private applyInitialWidth() {
    // Determine appropriate width: site-specific, default, or constrained percentage
    let targetWidth = this.defaultWidth;
    
    // If we have a stored width for this site, use that
    if (this.siteSettings[this.currentHost]?.width) {
      targetWidth = this.siteSettings[this.currentHost].width;
      console.log(`Using stored width for ${this.currentHost}:`, targetWidth);
    }
    
    // Constrain within 15-50% of viewport
    const minWidth = Math.max(window.innerWidth * 0.15, 100);
    const maxWidth = window.innerWidth * 0.5;
    
    if (targetWidth < minWidth) targetWidth = minWidth;
    if (targetWidth > maxWidth) targetWidth = maxWidth;
    
    // Apply the width
    this.container.style.width = `${targetWidth}px`;
    console.log('Initial sidebar width set to:', targetWidth);
  }

  private initializeSidebar() {
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    
    // Create top toolbar row with close button
    const topToolbarContainer = document.createElement('div');
    topToolbarContainer.className = 'chat-toolbar top-toolbar';
    
    // Create a container for the hotkey hint and close button
    const closeButtonContainer = document.createElement('div');
    closeButtonContainer.className = 'close-button-container';
    
    // Add close button to top row
    const closeButton = document.createElement('button');
    closeButton.className = 'sidebar-close-button';
    closeButton.innerHTML = '✕';
    closeButton.title = 'Close sidebar (Alt+W)';
    closeButton.addEventListener('click', () => this.hide());
    
    // Add both elements to the container
    closeButtonContainer.appendChild(closeButton);
    
    // Push the container to the right
    closeButtonContainer.style.marginLeft = 'auto';
    
    // Add the container to the toolbar
    topToolbarContainer.appendChild(closeButtonContainer);
    
    // Create second toolbar row with clear history button
    const secondToolbarContainer = document.createElement('div');
    secondToolbarContainer.className = 'chat-toolbar second-toolbar';
    
    // Add clear history button to second row
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-history-button';
    clearButton.innerHTML = '🗑️ Clear History';
    clearButton.addEventListener('click', () => this.clearHistory());
    
    secondToolbarContainer.appendChild(clearButton);
    
    const input = document.createElement('textarea');
    input.className = 'chat-input';
    input.placeholder = 'Ask anything about this page...';

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = input.value.trim();
        if (message) {
          this.addUserMessage(message);
          await this.sendMessage(message);
          input.value = '';
        }
      }
    });

    this.container.appendChild(this.resizer);
    this.container.appendChild(topToolbarContainer);
    this.container.appendChild(secondToolbarContainer);
    this.container.appendChild(chatContainer);
    this.container.appendChild(input);
  }

  private setupResizer() {
    let startX: number;
    let startWidth: number;
    
    const startResize = (e: MouseEvent) => {
      startX = e.clientX;
      startWidth = parseInt(getComputedStyle(this.container).width, 10);
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      e.preventDefault();
    };
    
    const resize = (e: MouseEvent) => {
      // Calculate new width (moving opposite direction since sidebar is from right)
      const newWidth = startWidth + (startX - e.clientX);
      
      // Constrain between 15% and 50% of viewport
      const minWidth = Math.max(window.innerWidth * 0.15, 100);
      const maxWidth = window.innerWidth * 0.5;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        this.container.style.width = `${newWidth}px`;
      }
    };
    
    const stopResize = () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      
      // Save the new width for this site
      const currentWidth = parseInt(getComputedStyle(this.container).width, 10);
      if (currentWidth > 0) {
        if (!this.siteSettings[this.currentHost]) {
          this.siteSettings[this.currentHost] = { width: currentWidth };
        } else {
          this.siteSettings[this.currentHost].width = currentWidth;
        }
        this.saveSiteSettings();
      }
    };
    
    this.resizer.addEventListener('mousedown', startResize);
  }

  private addUserMessage(message: string) {
    const chatContainer = this.container.querySelector('.chat-container');
    if (!chatContainer) return;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  private async sendMessage(message: string) {
    const pageContent = document.body.innerText;
    this.chatHistory.push({ role: 'user', content: message });
    
    // Save history after adding message
    this.saveSiteSettings();

    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'CHAT_MESSAGE',
      payload: {
        message,
        pageContent,
        history: this.chatHistory,
        model: this.currentModel
      }
    });
  }
  
  // Add method to clear history for current site
  public clearHistory() {
    console.log('Clearing chat history for', this.currentHost);
    this.chatHistory = [];
    
    // Clear the chat container UI
    const chatContainer = this.container.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.innerHTML = '';
      
      // Add a notification that history was cleared
      const notification = document.createElement('div');
      notification.className = 'system-message';
      notification.textContent = 'Chat history cleared';
      notification.style.textAlign = 'center';
      notification.style.padding = '10px';
      notification.style.color = '#666';
      notification.style.fontStyle = 'italic';
      chatContainer.appendChild(notification);
      
      // Remove notification after a few seconds
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
    
    // Update storage
    if (this.siteSettings[this.currentHost]) {
      this.siteSettings[this.currentHost].chatHistory = [];
      this.saveSiteSettings();
    }
  }

  // Update the sidebar UI to display cached conversations
  private displayCachedConversation() {
    if (this.chatHistory.length === 0) return;
    
    const chatContainer = this.container.querySelector('.chat-container');
    if (!chatContainer) return;
    
    // Clear existing messages (if any)
    chatContainer.innerHTML = '';
    
    // Display history
    this.chatHistory.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = message.role === 'user' 
        ? 'message user-message' 
        : 'message assistant-message';
      messageElement.textContent = message.content;
      chatContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  public async show() {
    console.log('Show sidebar called');
    
    // Ensure we have the latest settings
    await this.loadSiteSettings();
    
    // Apply the appropriate width before showing
    this.applyInitialWidth();
    
    // Force the browser to recompute layout before making visible
    this.container.getBoundingClientRect();
    
    // Display any cached conversation
    this.displayCachedConversation();
    
    // Make it visible
    this._isVisible = true;
    this.container.style.right = '0px';
    
    console.log('Sidebar shown, width:', this.container.style.width);
    
    // Make sure the input field is ready for typing
    const input = this.container.querySelector('.chat-input') as HTMLTextAreaElement;
    if (input) {
      setTimeout(() => {
        input.focus();
      }, 300); // After animation completes
    }
  }
  
  public hide() {
    console.log('Hide sidebar called');
    this._isVisible = false;
    this.container.style.right = '-9999px'; // Hide off-screen
    console.log('Sidebar hidden');
  }
  
  // Make sure toggle returns a Promise
  public async toggle(): Promise<void> {
    console.log('Toggle called, current visibility:', this._isVisible);
    if (this._isVisible) {
      this.hide();
    } else {
      await this.show();
    }
    return Promise.resolve();
  }
  
  public getContainer(): HTMLDivElement {
    return this.container;
  }

  public handleResponse(response: string) {
    const chatContainer = this.container.querySelector('.chat-container');
    if (!chatContainer) return;

    // Add the assistant's response to chat history
    this.chatHistory.push({ role: 'assistant', content: response });
    
    // Save history after adding response
    this.saveSiteSettings();

    // Create and append the message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant-message';
    messageElement.textContent = response;
    chatContainer.appendChild(messageElement);

    // Scroll to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  public updateModel(model: string) {
    this.currentModel = model;
    console.log('Model updated to:', model);
    
    // You might want to display this change in the UI
    const chatContainer = this.container.querySelector('.chat-container');
    if (chatContainer) {
      const modelNotification = document.createElement('div');
      modelNotification.className = 'model-notification';
      modelNotification.textContent = `Model changed to: ${model}`;
      modelNotification.style.padding = '5px';
      modelNotification.style.backgroundColor = '#f8f9fa';
      modelNotification.style.borderRadius = '5px';
      modelNotification.style.marginBottom = '10px';
      modelNotification.style.fontSize = '12px';
      modelNotification.style.textAlign = 'center';
      chatContainer.appendChild(modelNotification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        modelNotification.remove();
      }, 3000);
    }
  }
  
  // Method to check visibility status
  public isVisible(): boolean {
    return this._isVisible;  // Return the renamed property
  }
  
  public applyConstraints(): void {
    // Re-constrain the width based on the current window size
    const currentWidth = parseInt(getComputedStyle(this.container).width, 10);
    const minWidth = Math.max(window.innerWidth * 0.15, 100);
    const maxWidth = window.innerWidth * 0.5;
    
    let newWidth = currentWidth;
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;
    
    if (newWidth !== currentWidth) {
      this.container.style.width = `${newWidth}px`;
      
      // Update stored settings
      if (this.siteSettings[this.currentHost]) {
        this.siteSettings[this.currentHost].width = newWidth;
        this.saveSiteSettings();
      }
    }
  }
}