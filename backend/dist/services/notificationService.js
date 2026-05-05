"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.notificationQueue = void 0;
const bullmq_1 = require("bullmq");
const User_1 = __importDefault(require("../models/User"));
const logger_1 = require("../utils/logger");
// Redis connection configuration
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
// 1. Initialize the Notification Queue
exports.notificationQueue = new bullmq_1.Queue('notification-delivery', { connection });
/**
 * Service to process notification creation
 * In a real-world scenario, this might be triggered by an event
 */
const createNotification = async (data) => {
    if (data.userId) {
        // Single user notification
        await exports.notificationQueue.add('send-single', data);
    }
    else {
        // Broadcast to many users (Scale testing scenario)
        // We fetch users in batches and add jobs to the queue
        const batchSize = 1000;
        let lastId = null;
        let hasMore = true;
        while (hasMore) {
            const query = {};
            if (lastId)
                query._id = { $gt: lastId };
            const users = await User_1.default.find(query).limit(batchSize).select('_id');
            if (users.length === 0) {
                hasMore = false;
                break;
            }
            // Add each user to the queue individually to avoid long-running loops
            // and allow background workers to process them in parallel
            const jobs = users.map(user => ({
                name: 'send-single',
                data: { userId: user._id, type: data.type, message: data.message }
            }));
            await exports.notificationQueue.addBulk(jobs);
            lastId = users[users.length - 1]._id;
            if (users.length < batchSize)
                hasMore = false;
        }
    }
    (0, logger_1.log)('backend', 'info', 'domain', `Enqueued ${data.userId ? '1' : 'multiple'} notifications`);
};
exports.createNotification = createNotification;
