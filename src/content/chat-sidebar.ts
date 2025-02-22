/// <reference types="chrome"/>

export class ChatSidebar {
  private container: HTMLDivElement;
  private chatHistory: Array<{role: 'user' | 'assistant', content: string}> = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'overwatch-sidebar';
    this.initializeSidebar();
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
          await this.sendMessage(message);
          input.value = '';
        }
      }
    });

    this.container.appendChild(chatContainer);
    this.container.appendChild(input);
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
        history: this.chatHistory
      }
    });
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
}