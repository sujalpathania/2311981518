import { Queue, Worker } from 'bullmq';
import Notification, { NotificationType } from '../models/Notification';
import User from '../models/User';
import { log } from '../utils/logger';

import redisConnection from '../config/redisConfig';

// 1. Initialize the Notification Queue
export const notificationQueue = new Queue('notification-delivery', { connection: redisConnection });

/**
 * Service to process notification creation
 * In a real-world scenario, this might be triggered by an event
 */
export const createNotification = async (data: {
  userId?: string; // If empty, send to ALL (simulating broadcast)
  type: NotificationType;
  message: string;
}) => {
  if (data.userId) {
    // Single user notification
    await notificationQueue.add('send-single', data);
  } else {
    // Broadcast to many users (Scale testing scenario)
    // We fetch users in batches and add jobs to the queue
    const batchSize = 1000;
    let lastId = null;
    let hasMore = true;

    while (hasMore) {
      const query: any = {};
      if (lastId) query._id = { $gt: lastId };

      const users = await User.find(query).limit(batchSize).select('_id');
      
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

      await notificationQueue.addBulk(jobs);
      
      lastId = users[users.length - 1]._id;
      if (users.length < batchSize) hasMore = false;
    }
  }

  log('backend', 'info', 'domain', `Enqueued ${data.userId ? '1' : 'multiple'} notifications`);
};
