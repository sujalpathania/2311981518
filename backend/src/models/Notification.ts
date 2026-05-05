import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  PLACEMENT = 'Placement',
  EVENT = 'Event',
  RESULT = 'Result'
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: Object.values(NotificationType), 
    required: true 
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { 
  timestamps: { createdAt: true, updatedAt: false } 
});

// INDEXING STRATEGY (Production Grade)
// 1. Individual indexes for single-field filters
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ type: 1 });

// 2. Composite index for the most common query:
// "Get unread notifications for a student, ordered by date"
// This covers the specific optimization requested in Stage 3.
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
