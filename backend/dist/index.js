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
// 5. Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    (0, logger_1.log)('backend', 'error', 'middleware', `Unhandled Error: ${err.message}`);
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    (0, logger_1.log)('backend', 'info', 'config', `Server running on port ${PORT}`);
});
