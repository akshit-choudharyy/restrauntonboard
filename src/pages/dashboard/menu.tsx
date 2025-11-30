import React, { useEffect, useState } from "react";
import { 
  Typography, 
  IconButton, 
  Box, 
  Button, 
  Stack, 
  Chip,
  Badge,
  CircularProgress,
  TextField,
  InputAdornment,
  Drawer,
  useTheme,
  useMediaQuery,
  Divider,
  Grid,
  Paper,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Collapse,
  Avatar
} from "@mui/material";
import { 
  Add, 
  FilterList, 
  Search, 
  RestaurantMenu, 
  SearchOff,
  CurrencyRupee,
  Delete,
  Edit,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  TrendingUp,
  Inventory,
  Restaurant,
  ExpandMore,
  ExpandLess,
  FileUpload,
  Storefront,
  Circle
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import axiosInstance from "../../interceptor/axiosInstance";
import { RootState } from "../../store/store";
import AddDish from "../../components/ui/AddDish";
import EditDish from "./EditDish";
import XlFormat from "../../components/XlFormat";
import ImportBulk from "../../components/ImportBulk";

// ------------------- Types -------------------

interface MenuItemData {
  item_id: number;
  item_name: string;
  base_price: number;
  status: number;
  outlet_id: number;
  description: string;
  vendor_price: number;
  opening_time: string;
  closing_time: string;
  is_vegeterian: number;
  image: string | "NULL";
  cuisine: string;
  food_type: string;
  bulk_only: number | null;
  customisations: any;
  customisation_defaultBasePrice: any;
  tax: number;
  tax_percentage: number | null;
  verified: boolean;
  change_type: number | null;
  station_code: string;
}

interface MenuProps {
  restdata: any;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'price' | 'status' | 'cuisine';

// ------------------- Status Constants -------------------

const STATUS_OPTS = [
  { value: 1, label: 'Active', color: '#10B981' }, // Modern Emerald Green
  { value: 2, label: 'Closed', color: '#F59E0B' }, // Modern Amber
  { value: 0, label: 'Inactive', color: '#EF4444' }, // Modern Red
];

// ------------------- Design Constants -------------------
const PRIMARY_ORANGE = "#EB8041";
const CARD_RADIUS = 3;

const Menu: React.FC<MenuProps> = ({ restdata }) => {
  // ------------------- State -------------------
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItemData[]>([]);
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [foodTypes, setFoodTypes] = useState<string[]>([]);
  
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [selectedFoodType, setSelectedFoodType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItemData | null>(null);
  const [statusChanging, setStatusChanging] = useState<number | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [isImportDialogOpen, setisImportDialogOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const outletid = useSelector((state: RootState) => state.outlet_id);

  // ------------------- Helpers -------------------

  const capitalizeWords = (str: string) => {
    if (!str) return "";
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatCuisineName = (cuisine: string) => {
    if (!cuisine) return "";
    return cuisine.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  const formatFoodType = (foodType: string) => {
    if (!foodType) return "";
    return foodType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusColor = (status: number) => {
    const opt = STATUS_OPTS.find(o => o.value === status);
    return opt ? opt.color : '#9e9e9e';
  };

  // ------------------- API Logic -------------------

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/dishes/?outlet_id=${outletid?.outlet_id}`);
      const rawData = res?.data?.data?.rows || [];
      const activeData = rawData.filter((item: MenuItemData) => 
        item.status !== 3 && item.change_type !== 3
      );
      const sortedData = activeData.sort((a: MenuItemData, b: MenuItemData) => {
        const order = { 1: 0, 2: 1, 0: 2 }; 
        // @ts-ignore
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
      setItems(sortedData);
      setFilteredItems(sortedData);
      const uniqueCuisines = [...new Set(sortedData.map((item: MenuItemData) => item.cuisine))].filter(Boolean) as string[];
      const uniqueFoodTypes = [...new Set(sortedData.map((item: MenuItemData) => item.food_type))].filter(Boolean) as string[];
      setCuisineTypes(uniqueCuisines);
      setFoodTypes(uniqueFoodTypes);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (itemId: number, newStatus: number) => {
    try {
      setStatusChanging(itemId);
      await axiosInstance.put(`/dish/${itemId}`, { 
        status: Number(newStatus),
        change_type: 3, 
        updated_at: new Date().toISOString() 
      });
      setItems(prev => prev.map(item => 
        item.item_id === itemId ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error("Error updating status:", error);
      fetchData();
    } finally {
      setStatusChanging(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete === null) return;
    try {
      setDeleteLoading(true);
      await axiosInstance.put(`/dish/${itemToDelete}`, { status: 3, change_type: 3 });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      await fetchData();
    } catch (error) {
      console.error("Error deleting menu item:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ------------------- Effects -------------------

  useEffect(() => {
    if (!createModalVisible && !editModalVisible) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createModalVisible, editModalVisible]);
  
  useEffect(() => { fetchData(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = items;
    if (selectedFoodType !== "all") filtered = filtered.filter(item => item.food_type === selectedFoodType);
    if (selectedCuisine !== "all") filtered = filtered.filter(item => item.cuisine === selectedCuisine);
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(query) || 
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.item_name.localeCompare(b.item_name);
        case 'price': return a.vendor_price - b.vendor_price;
        case 'status':
           const order = { 1: 0, 2: 1, 0: 2 };
           // @ts-ignore
           return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        case 'cuisine': return a.cuisine.localeCompare(b.cuisine);
        default: return 0;
      }
    });
    setFilteredItems(filtered);
  }, [selectedFoodType, selectedCuisine, items, searchQuery, sortBy]);

  // ------------------- Handlers -------------------

  const handleEditClick = (item: MenuItemData) => { setItemToEdit(item); setEditModalVisible(true); };
  const handleDeleteClick = (itemId: number) => { setItemToDelete(itemId); setDeleteDialogOpen(true); };
  const handleCloseEditModal = () => { setEditModalVisible(false); setItemToEdit(null); };
  const resetFilters = () => { setSelectedFoodType("all"); setSelectedCuisine("all"); setSearchQuery(""); setDrawerOpen(false); };

  // ------------------- Stats -------------------
  
  const activeItemsCount = items.filter(item => item.status === 1).length;
  const closedItemsCount = items.filter(item => item.status === 2).length;
  const inactiveItemsCount = items.filter(item => item.status === 0).length;
  const activeFiltersCount = (selectedFoodType !== "all" ? 1 : 0) + (selectedCuisine !== "all" ? 1 : 0) + (searchQuery.trim() !== "" ? 1 : 0);

  // ------------------- Render Components -------------------

  const StatusSelector = ({ item }: { item: MenuItemData }) => {
    if (statusChanging === item.item_id) return <CircularProgress size={20} thickness={5} sx={{ color: PRIMARY_ORANGE }} />;

    return (
      <FormControl variant="standard" size="small" sx={{ minWidth: 100 }}>
        <Select
          value={item.status}
          onChange={(e) => handleStatus(item.item_id, Number(e.target.value))}
          disableUnderline
          sx={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: getStatusColor(item.status),
            bgcolor: alpha(getStatusColor(item.status), 0.1),
            borderRadius: 4,
            px: 1.5,
            py: 0.2,
            transition: 'all 0.2s',
            '&:hover': { bgcolor: alpha(getStatusColor(item.status), 0.2) },
            '& .MuiSelect-select': { paddingRight: '20px !important' },
            '& .MuiSvgIcon-root': { color: getStatusColor(item.status), right: 4 }
          }}
        >
          {STATUS_OPTS.map((opt) => (
            <MuiMenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.85rem' }}>
              <Circle sx={{ fontSize: 8, color: opt.color, mr: 1.5 }} />
              {opt.label}
            </MuiMenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const StatCard = ({ title, count, icon, color }: any) => (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2.5, 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 4,
        border: '1px solid',
        borderColor: alpha(color, 0.2),
        background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha('#fff', 0)} 100%)`,
      }}
    >
      <Avatar variant="rounded" sx={{ bgcolor: alpha(color, 0.15), color: color, width: 56, height: 56 }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748', lineHeight: 1 }}>{count}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>{title}</Typography>
      </Box>
    </Paper>
  );

const MenuItemCard = ({ item }: { item: MenuItemData }) => {
    // Check if valid image exists
    const hasImage = item?.image && item?.image !== "NULL" && item?.image !== "";

    return (
      <Card
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3, // Matches CARD_RADIUS
          border: '1px solid #f0f0f0',
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
          overflow: 'visible',
          backgroundColor: '#ffffff',
          opacity: item.status === 0 ? 0.7 : 1,
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
            borderColor: alpha(PRIMARY_ORANGE, 0.3),
          }
        }}
      >
        <Box sx={{ position: 'relative', borderRadius: `${theme.spacing(3)} ${theme.spacing(3)} 0 0`, overflow: 'hidden' }}>
          
          {/* --- LOGIC CHANGE HERE --- */}
          {hasImage ? (
            <Box
              component="img"
              src={item.image}
              alt={item.item_name}
              sx={{ 
                width: '100%', 
                height: 190, 
                objectFit: 'cover',
                transition: 'transform 0.4s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: 190,
                bgcolor: '#F3F4F6', // Light gray background
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)' // Subtle gradient
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#9CA3AF', 
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  lineHeight: 1.2
                }}
              >
                {item.item_name}
              </Typography>
            </Box>
          )}
          
          {/* Veg/Non-veg & Price Overlay - This stays on top of either Image or Text */}
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 1.5,
              // Darker gradient if image exists, lighter shadow if text only
              background: hasImage 
                ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)' 
                : 'linear-gradient(to top, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)',
            }}
          >
            <Chip 
              size="small"
              label={item?.is_vegeterian === 1 ? 'VEG' : 'NON-VEG'}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                bgcolor: item?.is_vegeterian === 1 ? '#0A8A0A' : '#D6292C',
                color: 'white',
                border: '1px solid white'
              }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', color: hasImage ? 'white' : '#374151' }}>
              <CurrencyRupee sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{item?.vendor_price}</Typography>
            </Box>
          </Stack>
  
          {/* Floating Status Dot */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 12,
              height: 12,
              bgcolor: getStatusColor(item.status),
              borderRadius: '50%',
              boxShadow: '0 0 0 3px white'
            }}
          />
        </Box>
        
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              mb: 0.5, 
              fontSize: '1rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {capitalizeWords(item.item_name)}
          </Typography>
          
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            {item.cuisine && (
              <Typography variant="caption" sx={{ color: 'text.secondary', bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1 }}>
                {formatCuisineName(item.cuisine)}
              </Typography>
            )}
            {item.food_type && (
              <Typography variant="caption" sx={{ color: 'text.secondary', bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1 }}>
                {formatFoodType(item.food_type)}
              </Typography>
            )}
          </Stack>
          
          {item?.description && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.85rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4
              }}
            >
              {item.description}
            </Typography>
          )}
        </CardContent>
        
        <Divider sx={{ borderStyle: 'dashed' }} />
  
        <CardActions sx={{ p: 1.5, pt: 1, justifyContent: 'space-between' }}>
          <StatusSelector item={item} />
          
          <Stack direction="row">
            <IconButton 
              size="small"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) } 
              }}
              onClick={() => handleEditClick(item)}
            >
              <Edit fontSize="small" />
            </IconButton>
            
            <IconButton 
              size="small"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) }
              }}
              onClick={() => handleDeleteClick(item.item_id)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Stack>
        </CardActions>
      </Card>
    );
  };

  const MenuItemListItem = ({ item }: { item: MenuItemData }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        transition: 'all 0.2s ease',
        opacity: item.status === 0 ? 0.6 : 1,
        '&:hover': {
          borderColor: PRIMARY_ORANGE,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={1}>
          <Avatar
            variant="rounded"
            src={item?.image && item?.image !== "NULL" ? item.image : ""}
            alt={item.item_name}
            sx={{ width: 60, height: 60, borderRadius: 2 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {capitalizeWords(item.item_name)}
              </Typography>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: item?.is_vegeterian === 1 ? '#0A8A0A' : '#D6292C',
                }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {formatFoodType(item.food_type)} • {formatCuisineName(item.cuisine)}
            </Typography>
          </Stack>
        </Grid>
        
        <Grid item xs={6} sm={2}>
           <Typography variant="body1" sx={{ fontWeight: 700, color: '#2d3748' }}>
            ₹{item?.vendor_price}
          </Typography>
        </Grid>
        
        <Grid item xs={6} sm={2}>
           <StatusSelector item={item} />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
             <Button 
                startIcon={<Edit />} 
                size="small" 
                variant="outlined" 
                color="inherit"
                onClick={() => handleEditClick(item)}
                sx={{ borderColor: '#e0e0e0', color: 'text.secondary' }}
             >
               Edit
             </Button>
             <IconButton 
               size="small" 
               sx={{ color: '#ef4444', bgcolor: '#fef2f2' }} 
               onClick={() => handleDeleteClick(item.item_id)}
             >
                <Delete fontSize="small" />
             </IconButton>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* Header Section */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', md: 'center' }} sx={{ mb: 4 }} spacing={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
            Menu Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your dishes, prices, and availability.
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
          {!isMobile && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            >
              <ToggleButton value="grid" sx={{ px: 2 }}><ViewModuleIcon /></ToggleButton>
              <ToggleButton value="list" sx={{ px: 2 }}><ViewListIcon /></ToggleButton>
            </ToggleButtonGroup>
          )}
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateModalVisible(true)}
            sx={{ 
              bgcolor: PRIMARY_ORANGE, 
              boxShadow: '0 4px 14px 0 rgba(235, 128, 65, 0.39)',
              '&:hover': { bgcolor: '#D26E2F' },
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Add New Item
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
             <XlFormat data={items} isLoading={loading}/>
             <Button
               variant="outlined"
               onClick={() => setisImportDialogOpen(true)}
               sx={{ minWidth: 40, px: 1, borderRadius: 2, borderColor: '#e0e0e0', color: 'text.secondary' }}
             >
               <FileUpload />
             </Button>
          </Box>
        </Stack>
      </Stack>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Items" count={items.length} icon={<Restaurant />} color="#3B82F6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Dishes" count={activeItemsCount} icon={<TrendingUp />} color="#10B981" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Closed Today" count={closedItemsCount} icon={<Storefront />} color="#F59E0B" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Inactive" count={inactiveItemsCount} icon={<Inventory />} color="#EF4444" />
        </Grid>
      </Grid>
      
      {/* Search and Filter Section */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: '1px solid #e0e0e0' }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              size="small"
              placeholder="Search items, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery("")} size="small"><SearchOff fontSize="small" /></IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: '#f9fafb', '& fieldset': { border: 'none' } }
              }}
            />
            
            {!isMobile && (
              <>
                <FormControl sx={{ minWidth: 160 }} size="small">
                  <InputLabel>Food Type</InputLabel>
                  <Select 
                    value={selectedFoodType} 
                    onChange={(e) => setSelectedFoodType(e.target.value)} 
                    label="Food Type"
                    sx={{ borderRadius: 2 }}
                  >
                    <MuiMenuItem value="all">All Types</MuiMenuItem>
                    {foodTypes.map((type) => (
                      <MuiMenuItem key={type} value={type}>{formatFoodType(type)}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 160 }} size="small">
                  <InputLabel>Cuisine</InputLabel>
                  <Select 
                    value={selectedCuisine} 
                    onChange={(e) => setSelectedCuisine(e.target.value)} 
                    label="Cuisine"
                    sx={{ borderRadius: 2 }}
                  >
                    <MuiMenuItem value="all">All Cuisines</MuiMenuItem>
                    {cuisineTypes.map((cuisine) => (
                      <MuiMenuItem key={cuisine} value={cuisine}>{formatCuisineName(cuisine)}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 140 }} size="small">
                  <InputLabel>Sort by</InputLabel>
                  <Select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as SortOption)} 
                    label="Sort by"
                    sx={{ borderRadius: 2 }}
                  >
                    <MuiMenuItem value="name">Name</MuiMenuItem>
                    <MuiMenuItem value="price">Price: Low to High</MuiMenuItem>
                    <MuiMenuItem value="status">Status</MuiMenuItem>
                    <MuiMenuItem value="cuisine">Cuisine</MuiMenuItem>
                  </Select>
                </FormControl>
              </>
            )}
            
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setDrawerOpen(true)}
                fullWidth
                sx={{ borderRadius: 2, height: 40 }}
              >
                Filters {activeFiltersCount > 0 && <Badge badgeContent={activeFiltersCount} color="primary" sx={{ ml: 1 }} />}
              </Button>
            )}
          </Stack>
          
          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                 <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>ACTIVE FILTERS:</Typography>
                 {selectedFoodType !== "all" && <Chip size="small" label={formatFoodType(selectedFoodType)} onDelete={() => setSelectedFoodType("all")} sx={{ borderRadius: 1 }}/>}
                 {selectedCuisine !== "all" && <Chip size="small" label={formatCuisineName(selectedCuisine)} onDelete={() => setSelectedCuisine("all")} sx={{ borderRadius: 1 }}/>}
                 {searchQuery.trim() !== "" && <Chip size="small" label={`Search: "${searchQuery}"`} onDelete={() => setSearchQuery("")} sx={{ borderRadius: 1 }}/>}
                 <Button size="small" onClick={resetFilters} sx={{ textTransform: 'none', color: 'text.secondary' }}>Clear all</Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
      
      {/* Menu Items Display */}
      <Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
            <CircularProgress sx={{ color: PRIMARY_ORANGE }} />
          </Box>
        ) : filteredItems.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <Grid container spacing={3}>
                {filteredItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.item_id}>
                    <MenuItemCard item={item} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Stack spacing={2}>
                {filteredItems.map((item) => (
                  <MenuItemListItem key={item.item_id} item={item} />
                ))}
              </Stack>
            )}
          </>
        ) : (
          <Paper 
            elevation={0} 
            sx={{ 
              textAlign: "center", 
              py: 10, 
              px: 2, 
              bgcolor: 'transparent',
              border: '2px dashed #e0e0e0',
              borderRadius: 4
            }}
          >
            <RestaurantMenu sx={{ fontSize: 60, color: "text.disabled", mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No menu items found</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Try adjusting your search or filters to find what you're looking for.
            </Typography>
            <Button variant="outlined" onClick={resetFilters} sx={{ borderRadius: 2 }}>Clear Filters</Button>
          </Paper>
        )}
      </Box>
      
      {/* Dialogs */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this menu item? This action cannot be easily undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
            disableElevation
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <Delete />}
            sx={{ borderRadius: 2 }}
          >
            Delete Item
          </Button>
        </DialogActions>
      </Dialog>
      
      <AddDish
        open={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        outlet_id={Number(outletid?.outlet_id)}
      />
      
      <EditDish
        open={editModalVisible}
        onClose={handleCloseEditModal}
        item={itemToEdit}
        onSuccess={fetchData}
      />
      
      {isImportDialogOpen && (
        <ImportBulk
          open={isImportDialogOpen}
          onOpenChange={setisImportDialogOpen}
          outletId={outletid?.outlet_id}
        />
      )}
      
      {/* Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, px: 3, pb: 4, pt: 2, maxHeight: "85vh" } }}
      >
        <Box sx={{ width: "100%" }}>
          <Box sx={{ width: 40, height: 4, bgcolor: '#e0e0e0', borderRadius: 2, mx: 'auto', mb: 2 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={700}>Filter Menu</Typography>
            <Button onClick={resetFilters} size="small">Reset</Button>
          </Stack>
          
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Food Type</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            <Chip 
              label="All" 
              variant={selectedFoodType === "all" ? "filled" : "outlined"}
              color={selectedFoodType === "all" ? "primary" : "default"}
              onClick={() => setSelectedFoodType("all")}
            />
            {foodTypes?.map((type) => (
              <Chip 
                key={type} 
                label={formatFoodType(type)}
                variant={selectedFoodType === type ? "filled" : "outlined"}
                color={selectedFoodType === type ? "primary" : "default"}
                onClick={() => setSelectedFoodType(type)}
              />
            ))}
          </Box>
          
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Cuisine</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
            <Chip 
              label="All" 
              variant={selectedCuisine === "all" ? "filled" : "outlined"}
              color={selectedCuisine === "all" ? "primary" : "default"}
              onClick={() => setSelectedCuisine("all")}
            />
            {cuisineTypes?.map((cuisine) => (
              <Chip 
                key={cuisine} 
                label={formatCuisineName(cuisine)}
                variant={selectedCuisine === cuisine ? "filled" : "outlined"}
                color={selectedCuisine === cuisine ? "primary" : "default"}
                onClick={() => setSelectedCuisine(cuisine)}
              />
            ))}
          </Box>
          
          <Button 
            variant="contained" 
            fullWidth 
            onClick={() => setDrawerOpen(false)}
            sx={{ borderRadius: 3, height: 48, bgcolor: PRIMARY_ORANGE }}
          >
            Show Results
          </Button>
        </Box>
      </Drawer>
    </Container>
  );
};

export default Menu;