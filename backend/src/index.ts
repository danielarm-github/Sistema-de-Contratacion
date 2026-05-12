import http from 'http';
import app from './app';
import { socketManager } from './lib/socketManager';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role_id: number;
      };
    }
  }
}

const PORT = process.env.PORT || 3001;

// Crear servidor HTTP que comparte Express + Socket.IO
const httpServer = http.createServer(app);

// Inicializar Socket.IO sobre el mismo servidor HTTP
socketManager.init(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready at ws://localhost:${PORT}`);
});
