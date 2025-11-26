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
  MenuItem as MuiMenuItem, // Renamed to avoid conflict with interface
  Collapse
} from "@mui/material";
import { 
  Add, 
  FilterList, 
  Search, 
  RestaurantMenu, 
  SearchOff,
  CurrencyRupee,
  ClearAll,
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
  Storefront // Icon for Closed
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
  status: number; // 0: Inactive, 1: Active, 2: Closed, 3: Deleted
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
  { value: 1, label: 'Active', color: '#4caf50' },
  { value: 2, label: 'Closed', color: '#ff9800' },
  { value: 0, label: 'Inactive', color: '#f44336' },
];

const Menu: React.FC<MenuProps> = ({ restdata }) => {
  // ------------------- State -------------------
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItemData[]>([]);
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [foodTypes, setFoodTypes] = useState<string[]>([]);
  
  // Filters
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [selectedFoodType, setSelectedFoodType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  
  // UI State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Action State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItemData | null>(null);
  const [statusChanging, setStatusChanging] = useState<number | null>(null);
  
  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [isImportDialogOpen, setisImportDialogOpen] = useState(false);

  // Hooks
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
    switch(status) {
      case 1: return '#4caf50'; // Active - Green
      case 2: return '#ff9800'; // Closed - Orange
      case 0: return '#f44336'; // Inactive - Red
      default: return '#9e9e9e';
    }
  };

  // ------------------- API Logic -------------------

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/dishes/?outlet_id=${outletid?.outlet_id}`);
      
      const rawData = res?.data?.data?.rows || [];

      // Filter: Exclude Deleted (Status 3) items
      const activeData = rawData.filter((item: MenuItemData) => 
        item.status !== 3 && item.change_type !== 3
      );
      
      // Initial Sort: Active > Closed > Inactive
      const sortedData = activeData.sort((a: MenuItemData, b: MenuItemData) => {
        // Custom sort order: 1 (Active) -> 2 (Closed) -> 0 (Inactive)
        const order = { 1: 0, 2: 1, 0: 2 }; 
        // @ts-ignore
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
      
      setItems(sortedData);
      setFilteredItems(sortedData);
      
      // Extract unique types for filters
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
        change_type: 3, // Assuming change_type 3 is used for updates based on context, or null
        updated_at: new Date().toISOString() 
      });
      
      // Optimistic update
      setItems(prev => prev.map(item => 
        item.item_id === itemId ? { ...item, status: newStatus } : item
      ));
      
    } catch (error) {
      console.error("Error updating status:", error);
      fetchData(); // Revert on error
    } finally {
      setStatusChanging(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete === null) return;
    
    try {
      setDeleteLoading(true);
      // Status 3 means deleted
      await axiosInstance.put(`/dish/${itemToDelete}`, { 
        status: 3,
        change_type: 3 
      });
      
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      await fetchData(); // Refresh list to remove deleted item
    } catch (error) {
      console.error("Error deleting menu item:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ------------------- Effects -------------------

  useEffect(() => {
    if (!createModalVisible && !editModalVisible) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createModalVisible, editModalVisible]);
  
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = items;
    
    // 1. Filters
    if (selectedFoodType !== "all") {
      filtered = filtered.filter(item => item.food_type === selectedFoodType);
    }
    
    if (selectedCuisine !== "all") {
      filtered = filtered.filter(item => item.cuisine === selectedCuisine);
    }
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(query) || 
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    // 2. Sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.item_name.localeCompare(b.item_name);
        case 'price':
          return a.vendor_price - b.vendor_price;
        case 'status':
           // Custom sort: Active (1) -> Closed (2) -> Inactive (0)
           const order = { 1: 0, 2: 1, 0: 2 };
           // @ts-ignore
           return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        case 'cuisine':
          return a.cuisine.localeCompare(b.cuisine);
        default:
          return 0;
      }
    });
    
    setFilteredItems(filtered);
  }, [selectedFoodType, selectedCuisine, items, searchQuery, sortBy]);

  // ------------------- Handlers -------------------

  const handleEditClick = (item: MenuItemData) => {
    setItemToEdit(item);
    setEditModalVisible(true);
  };
  
  const handleDeleteClick = (itemId: number) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setItemToEdit(null);
  };
  
  const resetFilters = () => {
    setSelectedFoodType("all");
    setSelectedCuisine("all");
    setSearchQuery("");
    setDrawerOpen(false);
  };

  // ------------------- Stats Calculation -------------------
  
  const activeItemsCount = items.filter(item => item.status === 1).length;
  const closedItemsCount = items.filter(item => item.status === 2).length;
  const inactiveItemsCount = items.filter(item => item.status === 0).length;
  const avgPrice = items.length > 0 ? items.reduce((acc, item) => acc + item.vendor_price, 0) / items.length : 0;
  const activeFiltersCount = (selectedFoodType !== "all" ? 1 : 0) + (selectedCuisine !== "all" ? 1 : 0) + (searchQuery.trim() !== "" ? 1 : 0);

  // ------------------- Render Components -------------------

  const StatusSelector = ({ item }: { item: MenuItemData }) => {
    if (statusChanging === item.item_id) {
      return <CircularProgress size={24} sx={{ ml: 2 }} />;
    }

    return (
      <FormControl variant="standard" size="small" sx={{ minWidth: 100 }}>
        <Select
          value={item.status}
          onChange={(e) => handleStatus(item.item_id, Number(e.target.value))}
          disableUnderline
          sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: getStatusColor(item.status),
            '& .MuiSelect-select': {
              paddingTop: 0.5,
              paddingBottom: 0.5,
            }
          }}
        >
          {STATUS_OPTS.map((opt) => (
            <MuiMenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.85rem' }}>
              <Box component="span" sx={{ 
                width: 8, height: 8, borderRadius: '50%', 
                bgcolor: opt.color, display: 'inline-block', mr: 1 
              }} />
              {opt.label}
            </MuiMenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const MenuItemCard = ({ item }: { item: MenuItemData }) => (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        opacity: item.status === 0 ? 0.6 : 1, // Dim if inactive
        border: '1px solid',
        borderColor: item.status === 1 ? 'transparent' : '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          borderColor: '#E87C4E'
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="180"
          image={item?.image && item?.image !== "NULL" ? item.image : "https://via.placeholder.com/300x200?text=No+Image"}
          alt={item.item_name}
          sx={{ objectFit: 'cover' }}
        />
        
        {/* Veg/Non-veg indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            borderRadius: '4px',
            px: 1,
            py: 0.5,
            bgcolor: item?.is_vegeterian === 1 ? '#0A8A0A' : '#D6292C',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 700
          }}
        >
          {item?.is_vegeterian === 1 ? 'VEG' : 'NON-VEG'}
        </Box>

        {/* Status Dot */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            borderRadius: '50%',
            width: 14,
            height: 14,
            bgcolor: getStatusColor(item.status),
            border: '2px solid white',
            boxShadow: 1
          }}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.2, fontSize: '1.1rem' }}>
          {capitalizeWords(item.item_name)}
        </Typography>
        
        <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
          {item.food_type && (
            <Chip
              label={formatFoodType(item.food_type)}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontSize: '0.65rem',
                height: 20
              }}
            />
          )}
          {item.cuisine && (
            <Chip
              label={formatCuisineName(item.cuisine)}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                fontSize: '0.65rem',
                height: 20
              }}
            />
          )}
        </Stack>
        
        {item?.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 1, 
              lineHeight: 1.3,
              fontSize: '0.85rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {item.description}
          </Typography>
        )}
        
        <Typography 
          variant="h6" 
          color="#3B7F4B" 
          sx={{ 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            fontSize: '1rem'
          }}
        >
          <CurrencyRupee sx={{ fontSize: '1rem' }} />
          {item?.vendor_price}
          {item.base_price > item.vendor_price && (
            <Typography 
              component="span" 
              sx={{ 
                textDecoration: 'line-through', 
                color: 'text.disabled', 
                fontSize: '0.8rem', 
                ml: 1 
              }}
            >
              ₹{item.base_price}
            </Typography>
          )}
        </Typography>
      </CardContent>
      
      <Divider />

      <CardActions sx={{ p: 1.5, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={0}>
          <IconButton 
            size="small"
            color="primary"
            onClick={() => handleEditClick(item)}
          >
            <Edit fontSize="small" />
          </IconButton>
          
          <IconButton 
            size="small"
            color="error"
            onClick={() => handleDeleteClick(item.item_id)}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
        
        <StatusSelector item={item} />
      </CardActions>
    </Card>
  );

  const MenuItemListItem = ({ item }: { item: MenuItemData }) => (
    <Paper
      sx={{
        p: 2,
        transition: 'all 0.2s ease',
        opacity: item.status === 0 ? 0.6 : 1,
        border: '1px solid #e0e0e0',
        borderLeft: `4px solid ${getStatusColor(item.status)}`,
        '&:hover': {
          boxShadow: 3,
          borderColor: '#E87C4E'
        }
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={2} md={1}>
          <Box
            sx={{
              position: 'relative',
              width: 60,
              height: 60,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box
              component="img"
              src={item?.image && item?.image !== "NULL" ? item.image : "https://via.placeholder.com/60"}
              alt={item.item_name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={4} md={5}>
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {item.item_name}
              </Typography>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: item?.is_vegeterian === 1 ? '#0A8A0A' : '#D6292C',
                }}
              />
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {formatFoodType(item.food_type)} • {formatCuisineName(item.cuisine)}
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        
        <Grid item xs={6} sm={2}>
          <Typography 
            variant="subtitle1" 
            color="#3B7F4B" 
            sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}
          >
            <CurrencyRupee fontSize="small" />
            {item?.vendor_price}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
            <IconButton size="small" onClick={() => handleEditClick(item)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(item.item_id)}>
              <Delete fontSize="small" />
            </IconButton>
            <Box sx={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
              <StatusSelector item={item} />
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Menu Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your restaurant's menu items
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: { xs: 2, md: 0 } }}>
          {!isMobile && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
              sx={{ bgcolor: 'background.paper' }}
            >
              <ToggleButton value="grid"><ViewModuleIcon /></ToggleButton>
              <ToggleButton value="list"><ViewListIcon /></ToggleButton>
            </ToggleButtonGroup>
          )}
          
          <XlFormat data={items} isLoading={loading}/>
          
          <Button
            variant="outlined"
            startIcon={<FileUpload />}
            onClick={() => setisImportDialogOpen(true)}
          >
            Import
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateModalVisible(true)}
            sx={{ bgcolor: "#EB8041", "&:hover": { bgcolor: "#D26E2F" } }}
          >
            Add Item
          </Button>
        </Stack>
      </Stack>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid', borderColor: 'primary.main' }}>
            <Restaurant sx={{ fontSize: 30, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{items.length}</Typography>
            <Typography variant="caption" color="text.secondary">Total Items</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid', borderColor: 'success.main' }}>
            <TrendingUp sx={{ fontSize: 30, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{activeItemsCount}</Typography>
            <Typography variant="caption" color="text.secondary">Active</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid', borderColor: 'warning.main' }}>
            <Storefront sx={{ fontSize: 30, color: 'warning.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{closedItemsCount}</Typography>
            <Typography variant="caption" color="text.secondary">Closed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid', borderColor: 'error.main' }}>
            <Inventory sx={{ fontSize: 30, color: 'error.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{inactiveItemsCount}</Typography>
            <Typography variant="caption" color="text.secondary">Inactive</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery("")} size="small"><SearchOff fontSize="small" /></IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ flex: 1 }}
            />
            
            {!isMobile && (
              <>
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>Food Type</InputLabel>
                  <Select value={selectedFoodType} onChange={(e) => setSelectedFoodType(e.target.value)} label="Food Type">
                    <MuiMenuItem value="all">All Types</MuiMenuItem>
                    {foodTypes.map((type) => (
                      <MuiMenuItem key={type} value={type}>{formatFoodType(type)}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>Cuisine</InputLabel>
                  <Select value={selectedCuisine} onChange={(e) => setSelectedCuisine(e.target.value)} label="Cuisine">
                    <MuiMenuItem value="all">All Cuisines</MuiMenuItem>
                    {cuisineTypes.map((cuisine) => (
                      <MuiMenuItem key={cuisine} value={cuisine}>{formatCuisineName(cuisine)}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>Sort by</InputLabel>
                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} label="Sort by">
                    <MuiMenuItem value="name">Name</MuiMenuItem>
                    <MuiMenuItem value="price">Price</MuiMenuItem>
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
                sx={{ alignSelf: 'stretch' }}
              >
                Filters {activeFiltersCount > 0 && <Badge badgeContent={activeFiltersCount} color="primary" sx={{ ml: 1 }} />}
              </Button>
            )}
          </Stack>
          
          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <Box>
              <Button
                size="small"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                endIcon={filtersExpanded ? <ExpandLess /> : <ExpandMore />}
                sx={{ mb: 1, textTransform: 'none' }}
              >
                Active Filters ({activeFiltersCount})
              </Button>
              
              <Collapse in={filtersExpanded || !isMobile}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {selectedFoodType !== "all" && (
                    <Chip size="small" label={`Type: ${formatFoodType(selectedFoodType)}`} onDelete={() => setSelectedFoodType("all")} />
                  )}
                  {selectedCuisine !== "all" && (
                    <Chip size="small" label={`Cuisine: ${formatCuisineName(selectedCuisine)}`} onDelete={() => setSelectedCuisine("all")} />
                  )}
                  {searchQuery.trim() !== "" && (
                    <Chip size="small" label={`Search: ${searchQuery}`} onDelete={() => setSearchQuery("")} />
                  )}
                  <Chip size="small" label="Clear All" onClick={resetFilters} color="default" variant="outlined" />
                </Stack>
              </Collapse>
            </Box>
          )}
        </Stack>
      </Paper>
      
      {/* Menu Items Display */}
      <Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
            <CircularProgress />
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
          <Paper sx={{ textAlign: "center", py: 8, px: 2 }}>
            <RestaurantMenu sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No menu items found</Typography>
            <Button sx={{ mt: 2 }} onClick={resetFilters}>Clear Filters</Button>
          </Paper>
        )}
      </Box>
      
      {/* Dialogs */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this menu item? This will mark it as deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <Delete />}
          >
            Delete
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
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, px: 2, pb: 3, pt: 2, maxHeight: "80vh" } }}
      >
        <Box sx={{ width: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Filters</Typography>
            <Button onClick={resetFilters}>Clear All</Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>Food Type</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            <Chip 
              label="All" 
              color={selectedFoodType === "all" ? "primary" : "default"}
              onClick={() => setSelectedFoodType("all")}
            />
            {foodTypes?.map((type) => (
              <Chip 
                key={type} 
                label={formatFoodType(type)}
                color={selectedFoodType === type ? "primary" : "default"}
                onClick={() => setSelectedFoodType(type)}
              />
            ))}
          </Box>
          
          <Typography variant="subtitle2" gutterBottom>Cuisine</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            <Chip 
              label="All" 
              color={selectedCuisine === "all" ? "primary" : "default"}
              onClick={() => setSelectedCuisine("all")}
            />
            {cuisineTypes?.map((cuisine) => (
              <Chip 
                key={cuisine} 
                label={formatCuisineName(cuisine)}
                color={selectedCuisine === cuisine ? "primary" : "default"}
                onClick={() => setSelectedCuisine(cuisine)}
              />
            ))}
          </Box>
          
          <Button variant="contained" fullWidth onClick={() => setDrawerOpen(false)}>
            Apply
          </Button>
        </Box>
      </Drawer>
    </Container>
  );
};

export default Menu;