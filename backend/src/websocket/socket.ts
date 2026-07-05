import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import botService from '../services/bot.service.js';

export function setupSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*', // TODO: Production'da frontend domain'i kısıtla
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('[WS] Client connected:', socket.id);

    // Client current bot status isteyebilir
    socket.on('request_bot_status', () => {
      socket.emit('bot_status', botService.getStatus());
    });

    socket.on('disconnect', () => {
      console.log('[WS] Client disconnected:', socket.id);
    });
  });

  // Give bot service access to io
  botService.setSocketIO(io);

  return io;
}
