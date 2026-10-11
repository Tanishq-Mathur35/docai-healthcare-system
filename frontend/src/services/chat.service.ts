import api from './api';

export const chatService = {
  getRooms: () => api.get('/chat/rooms'),

  getMessages: (roomId: string) => api.get(`/chat/rooms/${roomId}/messages`),

  sendMessage: (roomId: string, content: string, attachmentUrl?: string) =>
    api.post(`/chat/rooms/${roomId}/messages`, { content, attachmentUrl }),

  getOrCreateRoom: (targetId: string) =>
    api.post('/chat/rooms', { targetId }),
};
