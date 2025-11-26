import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Stack,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Autocomplete,
  Box,
  CircularProgress,
  styled,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { 
  Close, 
  CloudUpload, 
  Image as ImageIcon,
  CurrencyRupee
} from '@mui/icons-material';
import axiosInstance from '../../interceptor/axiosInstance';

interface CreateItemProps {
  open: boolean;
  onClose: () => void;
  outlet_id: number;
}

interface FormState {
  item_name: string;
  base_price: number | ''; // MRP
  vendor_price: number | ''; // Selling Price
  status: number;
  outlet_id: number;
  description: string;
  opening_time: string;
  closing_time: string;
  is_vegeterian: number;
  image: string | null;
  cuisine: string;
  food_type: string;
  bulk_only: number;
  tax: number;
  tax_percentage: number | null;
  verified: boolean;
}

const FOOD_TYPES = [
  "SNACKS", "BREAKFAST", "STARTERS", "MAINS", "MAINS_GRAVY", "BREADS", 
  "THALI", "COMBO", "DESSERTS", "SOUP", "BEVERAGE", "NAVRATRI_SPECIAL", 
  "DIET", "BAKERY_CONFECTIONERY", "HEALTHY_DIET", "SWEETS", "DIWALI_SPECIAL", 
  "BIRYANI", "BULK", "SPECIALITY_ITEM", "CHAATS", "NAMKEENS", "SALADS", 
  "MOUTH_FRESHENER_DIGESTIVE", "PIZZA", "BURGER", "HOLI_SPECIAL", 
  "PASTAS", "TACOS", "QUESADILLAS", "SIDES", "JAIN_FOOD"
];

const CUISINES = [
  "SOUTH_INDIAN", "PUNJABI", "NORTH_INDIAN", "MUGHALAI", "BENGALI", "GOAN", 
  "TAMIL", "ANDHRA", "KERALA", "INDIAN_CHINESE", "CHINESE", "AWADHI", 
  "MALAYSIAN", "MAHARASHTRIAN", "TIBETAN", "SRI_LANKAN", "SIKKIMESE", 
  "TASTE_OF_BIHAR", "ASSAMESE", "BAKERY_CONFECTIONERY", "CONTINENTAL", 
  "ITALIAN", "MEXICAN", "LEBANESE", "MONGOLIAN", "MALABARI", "HYDERABADI", 
  "ODIYA", "MARATHI", "GUJRATI", "RAJASTHANI", "AMERICAN"
];

const STATUS_OPTIONS = [
  { value: 1, label: 'Active' },
  { value: 2, label: 'Closed' },
  { value: 0, label: 'Inactive' },
];

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function AddDish({ open, onClose, outlet_id }: CreateItemProps) {
  const [formState, setFormState] = useState<FormState>({
    item_name: '',
    base_price: '', // Initialize as empty to allow placeholder
    vendor_price: '',
    status: 1, // Default to Active
    outlet_id: outlet_id,
    description: '',
    opening_time: '09:00',
    closing_time: '22:00',
    is_vegeterian: 1,
    image: null,
    cuisine: 'NORTH_INDIAN',
    food_type: 'THALI',
    bulk_only: 0,
    tax: 0,
    tax_percentage: null,
    verified: false
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle Numeric Fields
    if (['vendor_price', 'base_price', 'bulk_only', 'is_vegeterian', 'status'].includes(name)) {
      const numValue = value === '' ? '' : Number(value);
      
      let updates: Partial<FormState> = { [name]: numValue };

      // Auto-calculate tax when vendor_price changes
      if (name === "vendor_price" && numValue !== '') {
        const price = Number(numValue);
        updates.tax = Number((price * 0.05).toFixed(2)); // 5% logic
        
        // If base_price is empty, auto-fill it with vendor_price (assuming no discount initially)
        if (formState.base_price === '') {
          updates.base_price = price;
        }
      }

      setFormState(prev => ({ ...prev, ...updates }));
    } else {
      // Handle String Fields with Capitalization
      let processedValue = value;
      if (['item_name', 'description'].includes(name)) {
        processedValue = capitalizeWords(value);
      }
      
      setFormState(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSelectChange = (name: keyof FormState, value: any) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    
    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large. Maximum size is 2MB.');
      setUploadingImage(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setSelectedImage(base64String);
      setFormState(prev => ({ ...prev, image: base64String }));
      setUploadingImage(false);
    };
    
    reader.onerror = () => {
      alert('Error reading file');
      setUploadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleCreateItem = async () => {
    if (!formState.item_name || formState.vendor_price === '' || formState.base_price === '') {
      alert('Please fill in Item Name, Vendor Price, and Base Price');
      return;
    }

    // Validation: Vendor Price should not exceed Base Price
    if (Number(formState.vendor_price) > Number(formState.base_price)) {
      alert('Vendor Price (Selling Price) cannot be higher than Base Price (MRP)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formState,
        outlet_id: outlet_id,
        // Ensure numbers are sent as numbers
        vendor_price: Number(formState.vendor_price),
        base_price: Number(formState.base_price),
        // Handle null image case
        image: formState.image || "NULL"
      };
      
      const response = await axiosInstance.post('/dish', payload);
      
      if (response.data?.status === 1 || response.status === 200 || response.status === 201) {
        onClose();
      } else {
        throw new Error('Creation failed');
      }
    } catch (error) {
      console.error('Creation failed:', error);
      alert('Failed to create item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <DialogTitle sx={{ borderBottom: '1px solid #eee', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Create New Menu Item</Typography>
          <IconButton onClick={onClose} edge="end">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, bgcolor: '#f8f9fa' }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', bgcolor: 'white', p: 4, borderRadius: 2, boxShadow: 1 }}>
          <Grid container spacing={3}>
            
            {/* Image Upload Section */}
            <Grid item xs={12} display="flex" flexDirection="column" alignItems="center">
              <Box 
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: 2,
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  border: '2px dashed #e0e0e0',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {uploadingImage ? (
                  <CircularProgress size={30} />
                ) : selectedImage ? (
                  <Box component="img" src={selectedImage} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Stack alignItems="center" spacing={1}>
                    <ImageIcon color="disabled" sx={{ fontSize: 40 }} />
                    <Typography variant="caption" color="text.secondary">No Image</Typography>
                  </Stack>
                )}
              </Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                size="small"
              >
                Upload Image
                <VisuallyHiddenInput type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} />
              </Button>
            </Grid>

            {/* Basic Details */}
            <Grid item xs={12} md={6}>
              <TextField 
                fullWidth 
                label="Item Name" 
                name="item_name" 
                value={formState.item_name} 
                onChange={handleChange} 
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formState.status}
                  label="Status"
                  onChange={(e) => handleSelectChange('status', Number(e.target.value))}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Classification */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={FOOD_TYPES}
                value={formState.food_type}
                onChange={(_, newValue) => handleSelectChange('food_type', newValue || 'THALI')}
                renderInput={(params) => <TextField {...params} label="Food Type" required />}
                getOptionLabel={(option) => option.replace(/_/g, ' ')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Autocomplete
                options={CUISINES}
                value={formState.cuisine}
                onChange={(_, newValue) => handleSelectChange('cuisine', newValue || 'NORTH_INDIAN')}
                renderInput={(params) => <TextField {...params} label="Cuisine" required />}
                getOptionLabel={(option) => option.replace(/_/g, ' ')}
              />
            </Grid>

            {/* Pricing Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>PRICING DETAILS</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    label="Base Price (MRP)" 
                    type="number" 
                    name="base_price" 
                    value={formState.base_price} 
                    onChange={handleChange} 
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><CurrencyRupee fontSize="small" /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    label="Vendor Price (Selling)" 
                    type="number" 
                    name="vendor_price" 
                    value={formState.vendor_price} 
                    onChange={handleChange} 
                    required
                    helperText={formState.tax > 0 ? `Includes ₹${formState.tax} Tax (5%)` : "Auto-calculates tax"}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><CurrencyRupee fontSize="small" /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField 
                    fullWidth 
                    label="Calculated Tax" 
                    value={formState.tax} 
                    disabled
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><CurrencyRupee fontSize="small" /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Description" 
                multiline 
                rows={3} 
                name="description" 
                value={formState.description} 
                onChange={handleChange} 
                placeholder="Describe the dish ingredients..."
              />
            </Grid>

            {/* Timings */}
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Opening Time" 
                type="time" 
                name="opening_time" 
                value={formState.opening_time} 
                InputLabelProps={{ shrink: true }} 
                onChange={handleChange} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Closing Time" 
                type="time" 
                name="closing_time" 
                value={formState.closing_time} 
                InputLabelProps={{ shrink: true }} 
                onChange={handleChange} 
              />
            </Grid>

            {/* Toggles */}
            <Grid item xs={12} sm={6}>
              <FormLabel component="legend">Dietary Preference</FormLabel>
              <RadioGroup 
                row 
                name="is_vegeterian" 
                value={formState.is_vegeterian} 
                onChange={handleChange as any}
              >
                <FormControlLabel value={1} control={<Radio color="success" />} label="Vegetarian" />
                <FormControlLabel value={0} control={<Radio color="error" />} label="Non-Vegetarian" />
              </RadioGroup>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormLabel component="legend">Order Type</FormLabel>
              <RadioGroup 
                row 
                name="bulk_only" 
                value={formState.bulk_only} 
                onChange={handleChange as any}
              >
                <FormControlLabel value={0} control={<Radio />} label="Standard" />
                <FormControlLabel value={1} control={<Radio />} label="Bulk Only" />
              </RadioGroup>
            </Grid>

          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose} size="large" color="inherit">Cancel</Button>
        <Button  
          onClick={handleCreateItem} 
          variant="contained" 
          size="large"
          disabled={submitting || uploadingImage}
          sx={{ 
            bgcolor: '#EB8041', 
            '&:hover': { bgcolor: '#D26E2F' },
            px: 4
          }} 
        >
          {submitting ? "Creating..." : "Create Item"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}