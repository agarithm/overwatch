export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatResponse {
    message: string;
    error?: string;
}

export interface OllamaRequest {
    model: string;
    messages: Message[];
    stream?: boolean;
}

export interface ChatPayload {
    message: string;
    pageContent: string;
    history: Message[];
}