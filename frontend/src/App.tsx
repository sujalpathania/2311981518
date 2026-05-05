import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Login from './components/Login';
import NotificationList from './components/NotificationList';
import { LogOut } from 'lucide-react';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    background: { default: '#f4f6f8' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid #e0e0e0' }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
                Campus Hub
              </Typography>
              {user && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2">Hello, <b>{user.name}</b></Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleLogout}
                    startIcon={<LogOut size={16} />}
                  >
                    Logout
                  </Button>
                </Box>
              )}
            </Toolbar>
          </Container>
        </AppBar>
      </Box>

      <Container maxWidth="lg">
        {!user ? (
          <Login onLogin={setUser} />
        ) : (
          <NotificationList user={user} />
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
