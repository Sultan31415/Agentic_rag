import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/rag';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatAPI = {
  streamChat: async (query: string, sessionId: string | null, onMessage: (data: any) => void, onError: (error: Error) => void) => {
    const url = `${API_BASE_URL}/chat/stream?query=${encodeURIComponent(query)}${sessionId ? `&session_id=${sessionId}` : ''}`;
    
    const eventSource = new EventSource(url);
    
    eventSource.addEventListener('thread_id', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ event: 'thread_id', data });
      } catch (error) {
        onError(error as Error);
      }
    });
    
    eventSource.addEventListener('start', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ event: 'start', data });
      } catch (error) {
        onError(error as Error);
      }
    });
    
    eventSource.addEventListener('message', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ event: 'message', data });
      } catch (error) {
        onError(error as Error);
      }
    });
    
    eventSource.addEventListener('done', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ event: 'done', data });
      } catch (error) {
        onError(error as Error);
      }
    });
    
    eventSource.addEventListener('error', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ event: 'error', data });
      } catch (error) {
        onError(error as Error);
      }
    });
    
    eventSource.onerror = (error) => {
      eventSource.close();
      onError(new Error('EventSource connection error'));
    };
    
    return () => eventSource.close();
  },
  
  createThread: async () => {
    const response = await api.post('/threads/create');
    return response.data;
  },
  
  getThreadMessages: async (threadId: string) => {
    const response = await api.get(`/threads/${threadId}/messages`);
    return response.data;
  },
  
  deleteThread: async (threadId: string) => {
    const response = await api.delete(`/threads/${threadId}`);
    return response.data;
  },
};

export const documentAPI = {
  upload: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  list: async () => {
    const response = await api.get('/documents');
    return response.data;
  },
  
  delete: async (filename: string) => {
    const response = await api.delete(`/documents/${filename}`);
    return response.data;
  },
  
  reindex: async () => {
    const response = await api.post('/documents/reindex');
    return response.data;
  },
};

