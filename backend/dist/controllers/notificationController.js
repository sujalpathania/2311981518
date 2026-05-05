"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.triggerNotification = exports.getNotifications = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Notification_1 = __importDefault(require("../models/Notification"));
const notificationService_1 = require("../services/notificationService");
const redisConfig_1 = __importDefault(require("../config/redisConfig"));
/**
 * @desc    Get all notifications with pagination and filtering
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    const skip = (page - 1) * limit;
    // CACHE STRATEGY
    const cacheKey = `notifications:${userId}:${page}:${limit}:${type || 'all'}`;
    const cachedData = await redisConfig_1.default.get(cacheKey);
    if (cachedData) {
        // log('backend', 'debug', 'controller', `Cache hit for ${cacheKey}`);
        res.json(JSON.parse(cachedData));
        return;
    }
    // QUERY OPTIMIZATION: Using the composite index (userId, isRead, createdAt)
    // or (userId, type) if type is provided.
    const query = { userId };
    if (type)
        query.type = type;
    const notifications = await Notification_1.default.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit);
    const total = await Notification_1.default.countDocuments(query);
    const response = {
        notifications,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
        }
    };
    // Cache the result for 60 seconds to reduce DB load
    await redisConfig_1.default.setex(cacheKey, 60, JSON.stringify(response));
    res.json(response);
});
/**
 * @desc    Create a notification (Simulated trigger)
 * @route   POST /api/notifications
 * @access  Private
 */
exports.triggerNotification = (0, express_async_handler_1.default)(async (req, res) => {
    const { userId, type, message } = req.body;
    if (!type || !message) {
        res.status(400);
        throw new Error('Type and message are required');
    }
    await (0, notificationService_1.createNotification)({ userId, type, message });
    res.status(202).json({ message: 'Notification delivery scheduled' });
});
/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = (0, express_async_handler_1.default)(async (req, res) => {
    const notification = await Notification_1.default.findById(req.params.id);
    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }
    notification.isRead = true;
    await notification.save();
    // Invalidate cache for this user
    const keys = await redisConfig_1.default.keys(`notifications:${notification.userId}:*`);
    if (keys.length > 0)
        await redisConfig_1.default.del(...keys);
    res.json({ message: 'Marked as read' });
});
