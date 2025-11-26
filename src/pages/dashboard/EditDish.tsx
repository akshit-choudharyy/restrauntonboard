import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  InputAdornment,
  Alert,
  Avatar,
  IconButton,
  Paper,
  Grid,
  Divider,
  Tooltip
} from "@mui/material";
import {
  CurrencyRupee,
  Close,
  Restaurant,
  Schedule,
  LocalOffer,
  Info,
  FileUpload,
  Lock // Added Lock icon for Base Price
} from "@mui/icons-material";
import axiosInstance from "../../interceptor/axiosInstance";

interface EditDishProps {
  open: boolean;
  onClose: () => void;
  item: MenuItemData | null;
  onSuccess?: () => void;
}

interface MenuItemData {
  item_id: number;
  item_name: string;
  base_price: number; // MRP
  status: number;
  outlet_id: number;
  description: string;
  vendor_price: number; // Selling Price
  opening_time: string;
  closing_time: string;
  is_vegeterian: number;
  image: string;
  cuisine: string;
  food_type: string;
  bulk_only: number;
  customisations: any;
  customisation_defaultBasePrice: any;
  station_code: string;
  tax?: number;
}

const STATUS_OPTIONS = [
  { value: 1, label: 'Active', color: '#4caf50' },
  { value: 2, label: 'Closed', color: '#ff9800' },
  { value: 0, label: 'Inactive', color: '#f44336' },
];

const EditDish: React.FC<EditDishProps> = ({ open, onClose, item, onSuccess }) => {
  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    base_price: "",
    vendor_price: "",
    tax: 0,
    opening_time: "",
    closing_time: "",
    is_vegeterian: 0,
    cuisine: "",
    food_type: "",
    bulk_only: 0,
    image: "",
    status: 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const foodTypeOptions = [
    "SNACKS", "BREAKFAST", "STARTERS", "MAINS", "MAINS_GRAVY", "BREADS", "THALI",
    "COMBO", "DESSERTS", "SOUP", "BEVERAGE", "NAVRATRI_SPECIAL", "DIET", "BAKERY_CONFECTIONERY",
    "HEALTHY_DIET", "SWEETS", "DIWALI_SPECIAL", "BIRYANI", "BULK", "SPECIALITY_ITEM",
    "CHAATS", "NAMKEENS", "SALADS", "MOUTH_FRESHENER_DIGESTIVE", "PIZZA", "BURGER",
    "HOLI_SPECIAL", "PASTAS", "TACOS", "QUESADILLAS", "SIDES", "JAIN_FOOD"
  ];

  const cuisineOptions = [
    "SOUTH_INDIAN", "PUNJABI", "NORTH_INDIAN", "MUGHALAI", "BENGALI", "GOAN", "TAMIL",
    "ANDHRA", "KERALA", "INDIAN_CHINESE", "CHINESE", "AWADHI", "MALAYSIAN", "MAHARASHTRIAN",
    "TIBETAN", "SRI_LANKAN", "SIKKIMESE", "TASTE_OF_BIHAR", "ASSAMESE", "BAKERY_CONFECTIONERY",
    "CONTINENTAL", "ITALIAN", "MEXICAN", "LEBANESE", "MONGOLIAN", "MALABARI", "HYDERABADI",
    "ODIYA", "MARATHI", "GUJRATI", "RAJASTHANI", "AMERICAN"
  ];

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    if (item && open) {
      const vPrice = item.vendor_price || 0;
      setFormData({
        item_name: item.item_name || "",
        description: item.description || "",
        base_price: item.base_price?.toString() || "",
        vendor_price: vPrice.toString(),
        tax: Number((vPrice * 0.05).toFixed(2)),
        opening_time: item.opening_time || "",
        closing_time: item.closing_time || "",
        is_vegeterian: item.is_vegeterian || 0,
        cuisine: item.cuisine || "",
        food_type: item.food_type || "",
        bulk_only: item.bulk_only || 0,
        image: item.image || "",
        status: item.status !== undefined ? item.status : 1
      });
      setError("");
    }
  }, [item, open]);

  const handleInputChange = (field: string, value: any) => {
    let processedValue = value;
    
    // Capitalization for text fields
    if ((field === "item_name" || field === "description") && typeof value === "string") {
      processedValue = capitalizeWords(value);
    }
    
    // Logic for Price and Tax
    if (field === "vendor_price") {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        vendor_price: value,
        tax: Number((numValue * 0.05).toFixed(2))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: processedValue
      }));
    }
    
    setError("");
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (e.g., JPG, PNG, WEBP).");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange("image", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.item_name.trim()) {
      setError("Item name is required");
      return false;
    }
    
    const vPrice = parseFloat(formData.vendor_price);
    const bPrice = parseFloat(formData.base_price);

    if (isNaN(vPrice) || vPrice <= 0) {
      setError("Valid vendor price is required");
      return false;
    }
    
    // Validation: Vendor Price cannot exceed Base Price
    if (vPrice > bPrice) {
      setError(`Selling Price (₹${vPrice}) cannot be greater than MRP (₹${bPrice})`);
      return false;
    }

    if (!formData.cuisine) {
      setError("Cuisine selection is required");
      return false;
    }
    if (!formData.food_type) {
      setError("Food type selection is required");
      return false;
    }
    if (!formData.opening_time || !formData.closing_time) {
      setError("Opening and Closing times are required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !item) return;

    try {
      setLoading(true);
      setError("");

      const payload = {
        item_name: formData.item_name.trim(),
        description: formData.description.trim(),
        base_price: parseFloat(formData.base_price),
        vendor_price: parseFloat(formData.vendor_price),
        opening_time: formData.opening_time,
        closing_time: formData.closing_time,
        is_vegeterian: formData.is_vegeterian,
        cuisine: formData.cuisine,
        food_type: formData.food_type,
        bulk_only: formData.bulk_only,
        image: formData.image,
        status: formData.status,
        verified: true,
        change_type: 1
      };

      await axiosInstance.put(`/dish/${item.item_id}`, payload);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error("Error updating dish:", error);
      setError(error?.response?.data?.message || "Failed to update menu item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "95vh",
          backgroundColor: "#f4f6f8"
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, backgroundColor: "white", borderBottom: '1px solid #eee' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                backgroundColor: "#EB8041",
                borderRadius: 2,
                p: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Restaurant sx={{ color: "white", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                Edit Menu Item
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {item?.item_id}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Stack spacing={2} sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          )}

          <Grid container spacing={3}>
            
            {/* Left Column: Image & Status */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Image Card */}
                <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom align="left">
                    Dish Image
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <Avatar
                      src={formData.image}
                      variant="rounded"
                      sx={{
                        width: 140,
                        height: 140,
                        mx: 'auto',
                        boxShadow: 2,
                        border: '1px solid #eee'
                      }}
                    >
                      <Restaurant fontSize="large" sx={{ opacity: 0.5 }} />
                    </Avatar>
                  </Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<FileUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    size="small"
                    fullWidth
                  >
                    Change Image
                  </Button>
                </Paper>

                {/* Status Card */}
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'white' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Item Status
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Current Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Current Status"
                      onChange={(e) => handleInputChange("status", Number(e.target.value))}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: opt.color, mr: 1.5 }} />
                            {opt.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 2 }} />

                  {/* Toggles */}
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Vegetarian</Typography>
                      <Switch
                        size="small"
                        checked={formData.is_vegeterian === 1}
                        onChange={(e) => handleInputChange("is_vegeterian", e.target.checked ? 1 : 0)}
                        color="success"
                      />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Bulk Only</Typography>
                      <Switch
                        size="small"
                        checked={formData.bulk_only === 1}
                        onChange={(e) => handleInputChange("bulk_only", e.target.checked ? 1 : 0)}
                        color="warning"
                      />
                    </Stack>
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            {/* Right Column: Form Fields */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'white', mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Info color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600} fontSize="1rem">
                    Basic Details
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Item Name"
                      value={formData.item_name}
                      onChange={(e) => handleInputChange("item_name", e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Cuisine</InputLabel>
                      <Select
                        value={formData.cuisine}
                        onChange={(e) => handleInputChange("cuisine", e.target.value)}
                        label="Cuisine"
                      >
                        {cuisineOptions.map((opt) => (
                          <MenuItem key={opt} value={opt}>{opt.replace(/_/g, ' ')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Food Type</InputLabel>
                      <Select
                        value={formData.food_type}
                        onChange={(e) => handleInputChange("food_type", e.target.value)}
                        label="Food Type"
                      >
                        {foodTypeOptions.map((opt) => (
                          <MenuItem key={opt} value={opt}>{opt.replace(/_/g, ' ')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      multiline
                      rows={2}
                      placeholder="Ingredients, preparation method..."
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'white' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <LocalOffer color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600} fontSize="1rem">
                    Pricing & Schedule
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Tooltip title="Base Price (MRP) cannot be edited. Contact admin to change.">
                      <TextField
                        fullWidth
                        label="Base Price (MRP)"
                        value={formData.base_price}
                        disabled // Disabled as requested
                        type="number"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><CurrencyRupee fontSize="small"/></InputAdornment>,
                          endAdornment: <InputAdornment position="end"><Lock fontSize="small" color="disabled"/></InputAdornment>,
                        }}
                        helperText="Fixed MRP"
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Vendor Price (Selling)"
                      value={formData.vendor_price}
                      onChange={(e) => handleInputChange("vendor_price", e.target.value)}
                      type="number"
                      required
                      error={Number(formData.vendor_price) > Number(formData.base_price)}
                      helperText={Number(formData.vendor_price) > Number(formData.base_price) ? "Cannot exceed MRP" : "Edit Selling Price"}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><CurrencyRupee fontSize="small"/></InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Tax (5%)"
                      value={formData.tax}
                      disabled
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><CurrencyRupee fontSize="small"/></InputAdornment>
                      }}
                      helperText="Auto-calculated"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Opening Time"
                      value={formData.opening_time}
                      onChange={(e) => handleInputChange("opening_time", e.target.value)}
                      type="time"
                      required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Schedule fontSize="small"/></InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Closing Time"
                      value={formData.closing_time}
                      onChange={(e) => handleInputChange("closing_time", e.target.value)}
                      type="time"
                      required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Schedule fontSize="small"/></InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: 'white' }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: "#EB8041",
            "&:hover": { bgcolor: "#D26E2F" },
            px: 4
          }}
        >
          {loading ? "Updating..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDish;