import { io } from 'socket.io-client'

export const socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 3,
  reconnection: true,
  transports: ['websocket'],
})