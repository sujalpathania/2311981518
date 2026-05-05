import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Container } from '@mui/material';
import API from '../api/api';
import { useLogger } from '../hooks/useLogger';

const Login: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { log } = useLogger();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      onLogin(data);
      log('info', 'page', `User logged in: ${email}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      log('error', 'page', `Login failed for ${email}`);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper 
        elevation={12} 
        sx={{ 
          p: 4, 
          borderRadius: 6, 
          backdropFilter: 'blur(10px)',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
        }}
      >
        <Typography variant="h4" align="center" gutterBottom fontWeight="800" color="primary" sx={{ letterSpacing: -1 }}>
          Campus Hub
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Access your placement and event alerts
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            variant="filled"
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="filled"
            sx={{ mb: 2 }}
          />
          
          {error && (
            <Typography color="error" variant="body2" align="center" sx={{ mt: 1, fontWeight: 500 }}>
              {error}
            </Typography>
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ 
              mt: 3, 
              py: 1.8, 
              borderRadius: 3, 
              textTransform: 'none', 
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 14px 0 rgba(25, 118, 210, 0.39)'
            }}
          >
            Sign In
          </Button>
        </form>
        
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="caption" display="block" align="center" color="text.secondary">
            Demo Credentials:
          </Typography>
          <Typography variant="caption" display="block" align="center" fontWeight="bold">
            test@test.com / password
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
