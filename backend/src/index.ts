import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { log } from './utils/logger';
import notificationRoutes from './routes/notificationRoutes';
import authRoutes from './routes/authRoutes';
import './workers/notificationWorker';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 1. Middleware
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware); // Required: request start, success, error

// 2. Database Connection
mongoose.set('bufferCommands', false);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_notifications', {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => log('backend', 'info', 'db', 'MongoDB Connected'))
  .catch((err) => log('backend', 'error', 'db', `MongoDB Connection Error: ${err.message}`));

// 3. Socket.io Logic
io.on('connection', (socket) => {
  log('backend', 'info', 'utils', `New Socket Connection: ${socket.id}`);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    log('backend', 'info', 'utils', `User ${userId} joined their notification room`);
  });

  socket.on('disconnect', () => {
    log('backend', 'info', 'utils', 'Socket Disconnected');
  });
});

// Make io accessible for other modules (like workers)
// In a production app, we would use Redis Adapter for Socket.io
app.set('socketio', io);

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// 5. Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || res.statusCode || 500;
  
  log('backend', 'error', 'middleware', `${req.method} ${req.url} - Error: ${err.message}`);
  
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle stray async errors
process.on('unhandledRejection', (reason: any) => {
  if (reason?.message?.includes('ECONNREFUSED') && reason?.message?.includes('6379')) {
    // Ignore Redis connection errors in global handler as they are handled in redisConfig
    return;
  }
  log('backend', 'error', 'config', `Unhandled Rejection: ${reason.message || reason}`);
});

process.on('uncaughtException', (err) => {
  log('backend', 'error', 'config', `Uncaught Exception: ${err.message}`);
  // Give it a second to log before exiting
  setTimeout(() => process.exit(1), 1000);
});

const startServer = (port: number | string) => {
  const p = typeof port === 'string' ? parseInt(port) : port;
  server.listen(p)
    .on('listening', () => {
      log('backend', 'info', 'config', `Server running on port ${p}`);
    })
    .on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log('backend', 'warn', 'config', `Port ${p} is in use, trying ${p + 1}...`);
        startServer(p + 1);
      } else {
        log('backend', 'error', 'config', `Server error: ${err.message}`);
      }
    });
};

const PORT = process.env.PORT || 5000;
startServer(PORT);

export { io };
