import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification';
import { createNotification } from '../services/notificationService';
import { log } from '../utils/logger';
import redis from '../config/redisConfig';

/**
 * @desc    Get all notifications with pagination and filtering
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type as string;

  const skip = (page - 1) * limit;

  // CACHE STRATEGY
  const cacheKey = `notifications:${userId}:${page}:${limit}:${type || 'all'}`;
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }
  } catch (err) {
    // Silent fail for cache - proceed to DB
  }

  // QUERY OPTIMIZATION: Using the composite index (userId, isRead, createdAt)
  // or (userId, type) if type is provided.
  const query: any = { userId };
  if (type) query.type = type;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(query);

  const response = {
    notifications,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  };

  // Cache the result for 60 seconds to reduce DB load
  try {
    await redis.setex(cacheKey, 60, JSON.stringify(response));
  } catch (err) {
    // Ignore cache write failures
  }

  res.json(response);
});

/**
 * @desc    Create a notification (Simulated trigger)
 * @route   POST /api/notifications
 * @access  Private
 */
export const triggerNotification = asyncHandler(async (req: Request, res: Response) => {
  const { userId, type, message } = req.body;

  if (!type || !message) {
    res.status(400);
    throw new Error('Type and message are required');
  }

  await createNotification({ userId, type, message });

  res.status(202).json({ message: 'Notification delivery scheduled' });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notification.isRead = true;
  await notification.save();

  // Invalidate cache for this user
  const keys = await redis.keys(`notifications:${notification.userId}:*`);
  if (keys.length > 0) await redis.del(...keys);

  res.json({ message: 'Marked as read' });
});
