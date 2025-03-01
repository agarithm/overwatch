/// <reference types="chrome"/>

export class ChatSidebar {
  private container: HTMLDivElement;
  private resizer: HTMLDivElement;
  private chatHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
  private isVisible: boolean = false;
  private currentModel: string = 'mistral';

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'overwatch-sidebar';
    
    // Create resizer element
    this.resizer = document.createElement('div');
    this.resizer.className = 'sidebar-resizer';
    
    this.initializeSidebar();
    this.setupResizer();
    
    // Make sure the sidebar is initially hidden
    this.container.style.right = '-400px';
  }

  private initializeSidebar() {
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    
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

  public toggle() {
    this.isVisible = !this.isVisible;
    
    // Force immediate style change for reliability
    if (this.isVisible) {
      console.log('Making sidebar visible');
      this.container.style.right = '0px';
    } else {
      console.log('Hiding sidebar');
      this.container.style.right = '-400px';
    }
    
    // For debugging
    console.log('Sidebar visibility state:', this.isVisible);
    console.log('Current right style:', this.container.style.right);
  }

  public getContainer(): HTMLDivElement {
    return this.container;
  }

  public handleResponse(response: string) {
    const chatContainer = this.container.querySelector('.chat-container');
    if (!chatContainer) return;

    // Add the assistant's response to chat history
    this.chatHistory.push({ role: 'assistant', content: response });

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
}