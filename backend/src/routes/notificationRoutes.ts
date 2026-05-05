import express from 'express';
import { 
  getNotifications, 
  triggerNotification, 
  markAsRead 
} from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/', protect, triggerNotification);
router.put('/:id/read', protect, markAsRead);

export default router;
