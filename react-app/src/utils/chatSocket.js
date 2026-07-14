import { io } from 'socket.io-client';
import { API_BASE } from './api';

// Socket origin = API base without the trailing /api path.
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '');

let socket = null;

/**
 * Lazily create a single shared Socket.IO connection. The httpOnly JWT cookie
 * is sent automatically (withCredentials), so the server authenticates the
 * handshake with the exact same session as the REST API.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
