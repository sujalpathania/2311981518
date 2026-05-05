import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  IconButton, 
  Pagination, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper,
  Divider,
  Badge,
  CircularProgress
} from '@mui/material';
import { CheckCheck, Bell, Calendar, Award, Briefcase } from 'lucide-react';
import API from '../api/api';
import { useSocket } from '../hooks/useSocket';
import { useLogger } from '../hooks/useLogger';

interface Notification {
  _id: string;
  type: 'Placement' | 'Event' | 'Result';
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcons = {
  Placement: <Briefcase size={20} color="#1976d2" />,
  Event: <Calendar size={20} color="#2e7d32" />,
  Result: <Award size={20} color="#ed6c02" />,
};

const NotificationList: React.FC<{ user: any }> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const socket = useSocket(user?._id);
  const { log } = useLogger();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/notifications', {
        params: { page, limit: 5, type: typeFilter }
      });
      setNotifications(data.notifications);
      setTotalPages(data.pagination.pages);
      log('info', 'component', `Fetched ${data.notifications.length} notifications`);
    } catch (error: any) {
      log('error', 'component', `Failed to fetch notifications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, log]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('new-notification', (notification: Notification) => {
      log('info', 'component', 'New real-time notification received');
      // If we are on the first page and no filter or matching filter, add to top
      if (page === 1 && (!typeFilter || typeFilter === notification.type)) {
        setNotifications(prev => [notification, ...prev].slice(0, 5));
      }
    });

    return () => {
      socket.off('new-notification');
    };
  }, [socket, page, typeFilter, log]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      log('info', 'component', `Marked notification ${id} as read`);
    } catch (error: any) {
      log('error', 'component', 'Failed to mark as read');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, px: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bell size={24} /> Notifications
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter Type</InputLabel>
            <Select
              value={typeFilter}
              label="Filter Type"
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Placement">Placement</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
              <MenuItem value="Result">Result</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" sx={{ py: 4 }}>
            No notifications found
          </Typography>
        ) : (
          <List>
            {notifications.map((n) => (
              <ListItem
                key={n._id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: n.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                  transition: 'background 0.3s'
                }}
                secondaryAction={
                  !n.isRead && (
                    <IconButton edge="end" onClick={() => handleMarkAsRead(n._id)} title="Mark as read">
                      <CheckCheck size={20} color="#1976d2" />
                    </IconButton>
                  )
                }
              >
                <Box sx={{ mr: 2 }}>
                  <Badge color="primary" variant="dot" invisible={n.isRead}>
                    {typeIcons[n.type]}
                  </Badge>
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight={n.isRead ? 400 : 600}>
                        {n.message}
                      </Typography>
                      <Chip label={n.type} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </Box>
                  }
                  secondary={new Date(n.createdAt).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(_, v) => setPage(v)} 
            color="primary" 
            size="small"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationList;
