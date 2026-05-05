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
    <Box sx={{ maxWidth: 700, mx: 'auto', px: 2 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 6, 
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: -0.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
              <Bell size={20} />
            </Box>
            Latest Updates
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={typeFilter}
              label="Filter"
              variant="outlined"
              sx={{ borderRadius: 3 }}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Notifications</MenuItem>
              <MenuItem value="Placement">Placements</MenuItem>
              <MenuItem value="Event">Events</MenuItem>
              <MenuItem value="Result">Results</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress thickness={5} size={40} sx={{ borderRadius: 10 }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              All caught up!
            </Typography>
            <Typography variant="body2" color="text.disabled">
              No notifications found for this filter.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((n) => (
              <ListItem
                key={n._id}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 4,
                  bgcolor: n.isRead ? 'rgba(0,0,0,0.02)' : 'white',
                  border: n.isRead ? '1px solid transparent' : '1px solid #e3eefc',
                  boxShadow: n.isRead ? 'none' : '0 4px 12px 0 rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 15px 0 rgba(0,0,0,0.05)' }
                }}
                secondaryAction={
                  !n.isRead && (
                    <IconButton 
                      edge="end" 
                      onClick={() => handleMarkAsRead(n._id)} 
                      sx={{ bgcolor: '#e3eefc', color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                    >
                      <CheckCheck size={18} />
                    </IconButton>
                  )
                }
              >
                <Box sx={{ 
                  mr: 2.5, 
                  p: 1.5, 
                  borderRadius: 3, 
                  bgcolor: n.isRead ? '#f5f5f5' : '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Badge color="error" variant="dot" invisible={n.isRead} overlap="circular">
                    {typeIcons[n.type]}
                  </Badge>
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={n.isRead ? 500 : 700} sx={{ color: 'text.primary' }}>
                        {n.message}
                      </Typography>
                      <Chip 
                        label={n.type} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.65rem', 
                          fontWeight: 700,
                          bgcolor: n.type === 'Placement' ? '#e3f2fd' : n.type === 'Event' ? '#e8f5e9' : '#fff3e0',
                          color: n.type === 'Placement' ? '#1976d2' : n.type === 'Event' ? '#2e7d32' : '#ed6c02',
                          border: 'none'
                        }} 
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                      {new Date(n.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(_, v) => setPage(v)} 
            color="primary" 
            shape="rounded"
            size="medium"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationList;
