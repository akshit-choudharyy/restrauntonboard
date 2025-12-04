import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Switch as MuiSwitch,
  FormControlLabel,
  Stack,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  CssBaseline,
  Container,
  Menu,      
  MenuItem 
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Home,
  RestaurantMenu,
  HomeOutlined,
  AssessmentOutlined,
  CompareArrowsOutlined,
  StarOutline,
  ChevronLeft,
  Settings,
  AccountCircle,
  Notifications,
  Logout
} from '@mui/icons-material';
// import DashboardDrawer from '@/components/DashboardDrawer';
import HomePage from './home';
import ReportsPage from './reports';
import OrdersPage from './orders';
import MenuPage from './menu';
import FeedbackPage from './feedback';
import Closer from '../Closer';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import axiosInstance from '../../interceptor/axiosInstance';
import Delboy from './Delboy';
import Query from './Query';
import Queries from '../Queries';
import Offers from './Offers';
import OrderHistory from './OrderHistory';
import Profile from './Profile';
import Wallet from './Wallet';
import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';

const drawerWidth = 280;

const navItems = [
  { label: 'Dashboard', icon: <HomeOutlined />, path: '/dashboard' },
  { label: 'Reports', icon: <AssessmentOutlined />, path: '/dashboard/reports' },
  { label: 'Orders', icon: <CompareArrowsOutlined />, path: '/dashboard/orders' },
  { label: 'Menu', icon: <RestaurantMenu />, path: '/dashboard/menu' },
  { label: 'Feedback', icon: <StarOutline />, path: '/dashboard/feedback' },
];

const secondaryNavItems = [
  { label: 'Offers', icon: <StarOutline />, path: '/dashboard/offers' },
  { label: 'Order History', icon: <AssessmentOutlined />, path: '/dashboard/order-history' },
  { label: 'Delivery Staff', icon: <CompareArrowsOutlined />, path: '/dashboard/delboy' },
  { label: 'Queries', icon: <HomeOutlined />, path: '/dashboard/queries' },
  { label: 'Schduled Closer', icon: <Timer />, path: '/dashboard/closer' },
  { label: 'Wallet', icon: <AccountCircle />, path: '/dashboard/money' },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const outletid = useSelector((state: RootState) => state.outlet_id);
  
  const [restdata, setrestdata] = useState<any>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    const getdata = async() => {
      const res = await axiosInstance.get(`/restraunts`, { params: { outlet_id: outletid?.outlet_id }});
      console.log(res?.data?.data?.rows[0]);
      setrestdata(res?.data?.data?.rows[0]);
    }
    getdata();
  }, []);

  const currentPath = location.pathname;
  const allNavItems = [...navItems, ...secondaryNavItems];
  const currentItem = allNavItems.find(item => 
    currentPath === item.path || 
    (currentPath === '/dashboard' && item.path === '/dashboard')
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

    const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleGoToProfile = () => {
    handleProfileClose();
    navigate('/dashboard/profile');
  };

  const handleLogout = () => {
    handleProfileClose();
    localStorage.clear();
    navigate('/login');
  };

  const NavigationItem = ({ item, isSecondary = false }: { item: any, isSecondary?: boolean }) => {
    const isActive = currentPath === item.path || 
      (currentPath === '/dashboard' && item.path === '/dashboard');
    
    return (
      <ListItem disablePadding sx={{ display: 'block' }}>
        <ListItemButton
          onClick={() => navigate(item.path)}
          sx={{
            minHeight: 48,
            justifyContent: sidebarCollapsed ? 'center' : 'initial',
            px: 2.5,
            mx: 1,
            borderRadius: 2,
            mb: 0.5,
            backgroundColor: isActive ? '#E87C4E' : 'transparent',
            color: isActive ? 'white' : isSecondary ? '#666' : '#333',
            '&:hover': {
              backgroundColor: isActive ? '#E87C4E' : '#f5f5f5',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: sidebarCollapsed ? 'auto' : 3,
              justifyContent: 'center',
              color: isActive ? 'white' : isSecondary ? '#666' : '#E87C4E',
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label} 
            sx={{ 
              opacity: sidebarCollapsed ? 0 : 1,
              '& .MuiListItemText-primary': {
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400
              }
            }} 
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Restaurant Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
          src={restdata?.logo_image}
            sx={{ 
              bgcolor: '#E87C4E', 
              width: sidebarCollapsed ? 32 : 48, 
              height: sidebarCollapsed ? 32 : 48 
            }}
          >
          </Avatar>
          {!sidebarCollapsed && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>
                {restdata?.outlet_name || 'Restaurant Dashboard'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Restaurant Management
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List>
          {navItems.map((item) => (
            <NavigationItem key={item.path} item={item} />
          ))}
        </List>
        
        {!sidebarCollapsed && (
          <>
            <Divider sx={{ mx: 2, my: 2 }} />
            <Typography 
              variant="caption" 
              sx={{ px: 3, color: '#666', fontWeight: 600, textTransform: 'uppercase' }}
            >
              More Options
            </Typography>
          </>
        )}
        
        <List>
          {secondaryNavItems.map((item) => (
            <NavigationItem key={item.path} item={item} isSecondary />
          ))}
        </List>
      </Box>

      {/* Sidebar Toggle Button (Desktop only) */}
      {!isMobile && (
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <IconButton
            onClick={handleSidebarToggle}
            sx={{
              width: '100%',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              color: '#666'
            }}
          >
            <ChevronLeft sx={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }} />
            {!sidebarCollapsed && (
              <Typography variant="caption" sx={{ ml: 1 }}>
                Collapse
              </Typography>
            )}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top AppBar for Mobile */}
      {!isMobile && (
  <AppBar
    position="fixed"
    sx={{
      zIndex: theme.zIndex.drawer + 1,
      bgcolor: 'white',
      color: '#333',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      ml: sidebarCollapsed ? `${theme.spacing(9)}` : `${drawerWidth}px`,
      width: sidebarCollapsed ? `calc(100% - ${theme.spacing(9)})` : `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }}
  >
    <Toolbar sx={{ justifyContent: 'space-between' }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {currentPath === '/dashboard/menu' ? 'Menu Management' : currentItem?.label || 'Dashboard'}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton color="inherit">
          <Notifications />
        </IconButton>
<IconButton 
          onClick={handleProfileClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={openMenu ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={openMenu ? 'true' : undefined}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#E87C4E' }}>
            <AccountCircle />
          </Avatar>
        </IconButton>

        {/* 2. The Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={openMenu}
          onClose={handleProfileClose}
          onClick={handleProfileClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* Option 1: Profile */}
          <MenuItem onClick={handleGoToProfile}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>

          <Divider />

          {/* Option 2: Logout */}
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Toolbar>
  </AppBar>
)}

      {/* Desktop Top Bar */}
{isMobile && (
  <AppBar
    position="fixed"
    sx={{
      zIndex: theme.zIndex.drawer + 1,
      bgcolor: 'white',
      color: '#333',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}
  >
    <Toolbar>
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ mr: 2 }}
      >
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
        {currentPath === '/dashboard/menu' ? 'Menu Management' : currentItem?.label || 'Dashboard'}
      </Typography>
      <IconButton color="inherit">
                     <IconButton 
                onClick={handleProfileClick}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={openMenu ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openMenu ? 'true' : undefined}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#E87C4E' }}>
                  <AccountCircle />
                </Avatar>
              </IconButton>
                            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={openMenu}
                onClose={handleProfileClose}
                onClick={handleProfileClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleGoToProfile}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
        <Notifications />
      </IconButton>
    </Toolbar>
  </AppBar>
)}

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ 
          width: { md: sidebarCollapsed ? theme.spacing(9) : drawerWidth }, 
          flexShrink: { md: 0 } 
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarCollapsed ? theme.spacing(9) : drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8f9fa',
          minHeight: '100vh',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Routes>
           
             <Route path="/" element={<HomePage restdata={restdata} />} />
          <Route path="/reports" element={<ReportsPage restdata={restdata} />} />
          <Route path="/orders" element={<OrdersPage restdata={restdata} />} />
          <Route path="/menu" element={<MenuPage restdata={restdata} />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/closer" element={<Closer />} />
          <Route path="/delboy" element={<Delboy restdata={restdata}  />} />
          <Route path="/queries" element={<Queries />} />
          <Route path="/chat/:id" element={<Query />} />
          
          <Route path="/offers" element={<Offers/>} />
          <Route path="/order-history" element={<OrderHistory/>} />
          <Route path="/profile" element={<Profile restdata={restdata}  />} />
          <Route path="/money" element={<Wallet  />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}