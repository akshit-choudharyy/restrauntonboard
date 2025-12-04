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
  Grid,
  Paper,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Tooltip
} from "@mui/material";
import { 
  Add, 
  FilterList, 
  Search, 
  RestaurantMenu, 
  SearchOff,
  Delete,
  Edit,
  TrendingUp,
  Inventory,
  Restaurant,
  FileUpload,
  Storefront,
  InfoOutlined
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

type SortOption = 'name' | 'price' | 'status' | 'cuisine';

// ------------------- Design Constants -------------------
const PRIMARY_ORANGE = "#EB8041";

const Menu: React.FC<MenuProps> = ({ restdata }) => {
  // ------------------- State -------------------
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItemData[]>([]);
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [foodTypes, setFoodTypes] = useState<string[]>([]);
  
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [selectedFoodType, setSelectedFoodType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('name');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
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

  // ------------------- API Logic -------------------

const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/dishes/?outlet_id=${outletid?.outlet_id}`);
      const rawData = res?.data?.data?.rows || [];

      const activeData = rawData.filter((item: MenuItemData) => 
        item.change_type !== 3
      );

      const sortedData = activeData.sort((a: MenuItemData, b: MenuItemData) => {
        const order = { 3: 0, 1: 1, 2: 2, 0: 3 }; 
        // @ts-ignore
        return (order[a.status] ?? 4) - (order[b.status] ?? 4);
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
           const order = { 3: 0, 1: 1, 2: 2, 0: 3 };
           // @ts-ignore
           return (order[a.status] ?? 4) - (order[b.status] ?? 4);
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
  const pendingItemsCount = items.filter(item => item.status === 3).length;
  const activeFiltersCount = (selectedFoodType !== "all" ? 1 : 0) + (selectedCuisine !== "all" ? 1 : 0) + (searchQuery.trim() !== "" ? 1 : 0);

  // ------------------- Render Components -------------------

  const StatusSwitch = ({ item }: { item: MenuItemData }) => {
    if (statusChanging === item.item_id) return <CircularProgress size={20} thickness={5} sx={{ color: PRIMARY_ORANGE }} />;

    if (item.status === 3) {
      return (
        <Chip 
          label="Pending" 
          size="small"
          color="warning"
          variant="outlined"
          sx={{ height: 24, fontSize: '0.7rem' }}
        />
      );
    }

    return (
      <Switch
        checked={item.status === 1}
        onChange={(e) => handleStatus(item.item_id, e.target.checked ? 1 : 0)}
        size="small"
        sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#10B981',
              '& + .MuiSwitch-track': {
                backgroundColor: '#10B981',
                opacity: 0.5,
              },
            },
            '& .MuiSwitch-switchBase': {
                color: '#EF4444',
            },
             '& .MuiSwitch-track': {
                backgroundColor: '#EF4444',
                 opacity: 0.5,
             },
          }}
      />
    );
  };

  // Ultra Compact Stat Card
  const StatCard = ({ title, count, icon, color }: any) => (
    <Paper 
      elevation={0}
      sx={{ 
        p: 1, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(color, 0.2),
        background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha('#fff', 0)} 100%)`,
        height: 50 
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', pl: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.2 }}>
            {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#2d3748', lineHeight: 1.1, fontSize: '1rem' }}>
            {count}
        </Typography>
      </Box>
      <Avatar variant="rounded" sx={{ bgcolor: alpha(color, 0.1), color: color, width: 32, height: 32 }}>
        {React.cloneElement(icon, { sx: { fontSize: 18 } })}
      </Avatar>
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 2, minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      
      {/* Top Controls - Minimized Vertical Space */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
        <Grid item>
             <Button
                variant="contained"
                size="small" 
                startIcon={<Add />}
                onClick={() => setCreateModalVisible(true)}
                sx={{ 
                  bgcolor: PRIMARY_ORANGE, 
                  '&:hover': { bgcolor: '#D26E2F' },
                  borderRadius: 1.5,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Add New Item
            </Button>
        </Grid>
        <Grid item>
             <Box sx={{ display: 'flex', gap: 1 }}>
                 <XlFormat data={items} isLoading={loading}/>
                 <Button
                   variant="outlined"
                   size="small" 
                   onClick={() => setisImportDialogOpen(true)}
                   startIcon={<FileUpload />}
                   sx={{ borderRadius: 1.5, borderColor: '#e0e0e0', color: 'text.secondary', textTransform: 'none' }}
                 >
                   Upload
                 </Button>
             </Box>
        </Grid>
      </Grid>

      {/* Stats Overview - Ultra Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="TOTAL ITEMS" count={items.length} icon={<Restaurant />} color="#3B82F6" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="ACTIVE" count={activeItemsCount} icon={<TrendingUp />} color="#10B981" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="CLOSED" count={closedItemsCount} icon={<Storefront />} color="#F59E0B" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard title="INACTIVE" count={inactiveItemsCount} icon={<Inventory />} color="#EF4444" />
        </Grid>
        <Grid item xs={12} sm={4} md={2.4}>
          <StatCard title="PENDING" count={pendingItemsCount} icon={<Inventory />} color="#8B5CF6" />
        </Grid>
      </Grid>
      
      {/* Search Bar - Compact */}
      <Paper elevation={0} sx={{ p: 1, mb: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
            <TextField
              fullWidth
              size="small"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><Search color="action" fontSize="small" /></InputAdornment>),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery("")} size="small"><SearchOff fontSize="small" /></IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 1.5, bgcolor: '#f9fafb', '& fieldset': { border: 'none' }, fontSize: '0.9rem' }
              }}
            />
            
            {!isMobile && (
              <>
                <FormControl sx={{ minWidth: 140 }} size="small">
                  <InputLabel sx={{ fontSize: '0.85rem' }}>Food Type</InputLabel>
                  <Select 
                    value={selectedFoodType} 
                    onChange={(e) => setSelectedFoodType(e.target.value)} 
                    label="Food Type"
                    sx={{ borderRadius: 1.5, fontSize: '0.85rem' }}
                  >
                    <MuiMenuItem value="all">All Types</MuiMenuItem>
                    {foodTypes.map((type) => (
                      <MuiMenuItem key={type} value={type}>{formatFoodType(type)}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 140 }} size="small">
                  <InputLabel sx={{ fontSize: '0.85rem' }}>Cuisine</InputLabel>
                  <Select 
                    value={selectedCuisine} 
                    onChange={(e) => setSelectedCuisine(e.target.value)} 
                    label="Cuisine"
                    sx={{ borderRadius: 1.5, fontSize: '0.85rem' }}
                  >
                    <MuiMenuItem value="all">All Cuisines</MuiMenuItem>
                    {cuisineTypes.map((cuisine) => (
                      <MuiMenuItem key={cuisine} value={cuisine}>{formatCuisineName(cuisine)}</MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel sx={{ fontSize: '0.85rem' }}>Sort by</InputLabel>
                  <Select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as SortOption)} 
                    label="Sort by"
                    sx={{ borderRadius: 1.5, fontSize: '0.85rem' }}
                  >
                    <MuiMenuItem value="name">Name</MuiMenuItem>
                    <MuiMenuItem value="price">Price</MuiMenuItem>
                    <MuiMenuItem value="status">Status</MuiMenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        </Stack>
      </Paper>
      
      {/* Table View - Dense & Detailed */}
      <Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
            <CircularProgress sx={{ color: PRIMARY_ORANGE }} />
          </Box>
        ) : filteredItems.length > 0 ? (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: PRIMARY_ORANGE }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: 60, py: 1 }}>Image</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '25%', py: 1 }}>Item Details</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '15%', py: 1 }}>Category</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '15%', py: 1 }}>Pricing</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '15%', py: 1 }}>Times</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '10%', py: 1 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, width: '10%', py: 1, textAlign: 'right' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.item_id}
                    sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { bgcolor: '#F9FAFB' },
                        opacity: item.status === 0 ? 0.6 : 1
                    }}
                  >
                    <TableCell sx={{ py: 1 }}>
                      <Avatar
                        variant="rounded"
                        src={item?.image && item?.image !== "NULL" ? item.image : ""}
                        alt={item.item_name}
                        sx={{ width: 40, height: 40, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Stack spacing={0.2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                                sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: item?.is_vegeterian === 1 ? '#0A8A0A' : '#D6292C',
                                flexShrink: 0
                                }}
                            />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {capitalizeWords(item.item_name)}
                            </Typography>
                        </Stack>
                        {item.description && (
                             <Typography variant="caption" color="text.secondary" sx={{ 
                                 display: '-webkit-box',
                                 WebkitLineClamp: 1,
                                 WebkitBoxOrient: 'vertical',
                                 overflow: 'hidden',
                                 fontSize: '0.75rem',
                                 ml: 2
                             }}>
                                {item.description}
                            </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                         <Stack direction="column">
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#4B5563' }}>
                                {formatCuisineName(item.cuisine)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                                {formatFoodType(item.food_type)}
                            </Typography>
                         </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                        <Stack spacing={0}>
                           <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            ₹{(Number(item.base_price) + Number(item.tax)).toFixed(2)}
                           </Typography>
                           <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Base: ₹{item.base_price}
                           </Typography>
                        </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 500 }}>
                            {item.opening_time.substring(0, 5)} - {item.closing_time.substring(0, 5)}
                        </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                        <StatusSwitch item={item} />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1 }}>
                        <Stack direction="row" spacing={0} justifyContent="flex-end">
                             <Tooltip title="Edit">
                                <IconButton 
                                    size="small"
                                    onClick={() => handleEditClick(item)}
                                    sx={{ color: '#10B981' }}
                                >
                                    <Edit fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton 
                                    size="small" 
                                    sx={{ color: '#EF4444' }} 
                                    onClick={() => handleDeleteClick(item.item_id)}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper 
            elevation={0} 
            sx={{ 
              textAlign: "center", 
              py: 8, 
              bgcolor: 'transparent',
              border: '2px dashed #e0e0e0',
              borderRadius: 4
            }}
          >
            <RestaurantMenu sx={{ fontSize: 50, color: "text.disabled", mb: 1, opacity: 0.5 }} />
            <Typography variant="subtitle1" color="text.secondary">No items found</Typography>
          </Paper>
        )}
      </Box>
      
      {/* Dialogs */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this menu item?
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
        PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, px: 3, pb: 4, pt: 2, maxHeight: "85vh" } }}
      >
        <Box sx={{ width: "100%" }}>
          <Box sx={{ width: 40, height: 4, bgcolor: '#e0e0e0', borderRadius: 2, mx: 'auto', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} mb={3}>Filter Menu</Typography>
          
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Food Type</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            <Chip label="All" onClick={() => setSelectedFoodType("all")} color={selectedFoodType === "all" ? "primary" : "default"} />
            {foodTypes?.map((type) => (
              <Chip key={type} label={formatFoodType(type)} onClick={() => setSelectedFoodType(type)} color={selectedFoodType === type ? "primary" : "default"} />
            ))}
          </Box>
          
          <Button variant="contained" fullWidth onClick={() => setDrawerOpen(false)} sx={{ bgcolor: PRIMARY_ORANGE }}>
            Show Results
          </Button>
        </Box>
      </Drawer>
    </Container>
  );
};

export default Menu;