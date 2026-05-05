import { Worker, Job } from 'bullmq';
import Notification from '../models/Notification';
import { log } from '../utils/logger';
import { io } from '../index'; 
import redisConnection from '../config/redisConfig';

// 2. Define the Worker
export const notificationWorker = new Worker('notification-delivery', async (job: Job) => {
  const { userId, type, message } = job.data;

  try {
    // 1. Save to Database
    const notification = await Notification.create({
      userId,
      type,
      message,
      isRead: false
    });

    // 2. Simulating external notification (Email/Push)
    // log('backend', 'info', 'cron_job', `Sending external notification to user ${userId}...`);
    // await sendEmail(userId, message); // Simulated

    // 3. Emit real-time via Socket.io
    if (io) {
      io.to(userId.toString()).emit('new-notification', notification);
    }
    
    // log('backend', 'info', 'cron_job', `Notification ${notification._id} delivered successfully`);
  } catch (error: any) {
    log('backend', 'error', 'cron_job', `Failed to process job ${job.id}: ${error.message}`);
    throw error; // Let BullMQ handle the retry mechanism
  }
}, { 
  connection: redisConnection,
  concurrency: 50 
});

notificationWorker.on('failed', (job, err) => {
  log('backend', 'error', 'cron_job', `Job ${job?.id} failed after retries: ${err.message}`);
});
