export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  agent_name?: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
}

export interface Document {
  filename: string;
  size: number;
  modified: string;
}

export interface UploadResponse {
  status: string;
  filename: string;
  chunks_added: number;
  message: string;
}