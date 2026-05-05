"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const loggingMiddleware_1 = require("./middleware/loggingMiddleware");
const logger_1 = require("./utils/logger");
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
require("./workers/notificationWorker"); // Import to start the worker
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: "*" }
});
exports.io = io;
// 1. Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(loggingMiddleware_1.loggingMiddleware); // Required: request start, success, error
// 2. Database Connection
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_notifications')
    .then(() => (0, logger_1.log)('backend', 'info', 'db', 'MongoDB Connected'))
    .catch((err) => (0, logger_1.log)('backend', 'error', 'db', `MongoDB Connection Error: ${err.message}`));
// 3. Socket.io Logic
io.on('connection', (socket) => {
    (0, logger_1.log)('backend', 'info', 'utils', `New Socket Connection: ${socket.id}`);
    socket.on('join', (userId) => {
        socket.join(userId);
        (0, logger_1.log)('backend', 'info', 'utils', `User ${userId} joined their notification room`);
    });
    socket.on('disconnect', () => {
        (0, logger_1.log)('backend', 'info', 'utils', 'Socket Disconnected');
    });
});
// Make io accessible for other modules (like workers)
// In a production app, we would use Redis Adapter for Socket.io
app.set('socketio', io);
// 4. Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = err.status || res.statusCode || 500;
    (0, logger_1.log)('backend', 'error', 'middleware', `${req.method} ${req.url} - Error: ${err.message}`);
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
process.on('unhandledRejection', (reason) => {
    if (reason?.message?.includes('ECONNREFUSED') && reason?.message?.includes('6379')) {
        // Ignore Redis connection errors in global handler as they are handled in redisConfig
        return;
    }
    (0, logger_1.log)('backend', 'error', 'config', `Unhandled Rejection: ${reason.message || reason}`);
});
process.on('uncaughtException', (err) => {
    (0, logger_1.log)('backend', 'error', 'config', `Uncaught Exception: ${err.message}`);
    // Give it a second to log before exiting
    setTimeout(() => process.exit(1), 1000);
});
const startServer = (port) => {
    const p = typeof port === 'string' ? parseInt(port) : port;
    server.listen(p)
        .on('listening', () => {
        (0, logger_1.log)('backend', 'info', 'config', `Server running on port ${p}`);
    })
        .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            (0, logger_1.log)('backend', 'warn', 'config', `Port ${p} is in use, trying ${p + 1}...`);
            startServer(p + 1);
        }
        else {
            (0, logger_1.log)('backend', 'error', 'config', `Server error: ${err.message}`);
        }
    });
};
const PORT = process.env.PORT || 5000;
startServer(PORT);
