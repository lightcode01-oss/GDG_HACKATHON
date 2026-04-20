import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://crisis-backend-u49x.onrender.com', {
  autoConnect: false // Connect after login
});
