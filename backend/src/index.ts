import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { log } from './utils/logger';
import notificationRoutes from './routes/notificationRoutes';
import authRoutes from './routes/authRoutes';
import './workers/notificationWorker'; // Import to start the worker

dotenv.config();

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_notifications')
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

// 5. Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  log('backend', 'error', 'middleware', `Unhandled Error: ${err.message}`);
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  log('backend', 'info', 'config', `Server running on port ${PORT}`);
});

export { io };
