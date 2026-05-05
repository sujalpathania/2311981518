"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationWorker = void 0;
const bullmq_1 = require("bullmq");
const Notification_1 = __importDefault(require("../models/Notification"));
const logger_1 = require("../utils/logger");
const index_1 = require("../index"); // Note: In multi-process, use Redis Pub/Sub
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
// 2. Define the Worker
exports.notificationWorker = new bullmq_1.Worker('notification-delivery', async (job) => {
    const { userId, type, message } = job.data;
    try {
        // 1. Save to Database
        const notification = await Notification_1.default.create({
            userId,
            type,
            message,
            isRead: false
        });
        // 2. Simulating external notification (Email/Push)
        // log('backend', 'info', 'cron_job', `Sending external notification to user ${userId}...`);
        // await sendEmail(userId, message); // Simulated
        // 3. Emit real-time via Socket.io
        if (index_1.io) {
            index_1.io.to(userId.toString()).emit('new-notification', notification);
        }
        // log('backend', 'info', 'cron_job', `Notification ${notification._id} delivered successfully`);
    }
    catch (error) {
        (0, logger_1.log)('backend', 'error', 'cron_job', `Failed to process job ${job.id}: ${error.message}`);
        throw error; // Let BullMQ handle the retry mechanism
    }
}, {
    connection,
    concurrency: 50 // High scalability: process 50 jobs in parallel per worker instance
});
exports.notificationWorker.on('failed', (job, err) => {
    (0, logger_1.log)('backend', 'error', 'cron_job', `Job ${job?.id} failed after retries: ${err.message}`);
});
