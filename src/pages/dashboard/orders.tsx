import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  Paper,
} from '@mui/material';
import { AccessTime, Visibility, CheckCircle, LocalShipping, DoneAll, Cancel, Receipt, FileDownload, Close, ThumbUp, FiberNew } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import DashboardDrawer from '../../components/DashboardDrawer';
import { BellIcon, MenuIcon, WalletIcon } from 'lucide-react';
import axiosInstance from '../../interceptor/axiosInstance';
import Notification from './Notification';
import Wallet from './Wallet';
import logo from '../../components/assets/logo.png';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Data Interfaces ---
interface MenuItem {
    name: string;
    item_id: number;
    quantity: number;
    descriptiom: string; 
    SellingPrice: number;
    isVegetarian: boolean;
  }
  
  interface CustomerInfo {
    customerDetails: {
      mobile: string;
      customerName: string;
      alternateMobile: string;
    }
  }
  
  interface DeliveryDetails {
    deliveryDetails: {
      pnr: number;
      berth: string;
      coach: string;
      station: string;
      trainNo: string;
      stationCode: string;
      passengerCount: number;
    }
  }
  
  interface Order {
    oid: number;
    updated_at: string;
    pushed: number;
    updated_by: string;
    booked_from: string;
    menu_items: {
      items: MenuItem[];
    };
    customer_info: CustomerInfo;
    mode: string;
    created_at: string;
    delivery_date: string;
    status: string;
    discount_amount: number | null;
    irctc_discount: number | null;
    vendor_discount: number | null;
    delivery_details: DeliveryDetails;
    comment: string;
    outlet_id: number;
    outlet_name: string;
    gst: string;
    fssai: string;
    phone: string;
    fssai_valid: string;
    address: string;
    city: string;
    state: string;
    logo_image?: string; 
    rlname: string;
    rlphone: string;
    rlemail: string;
    station_name: string;
    station_code: string;
    del_id?: number; 
  }
  
  interface DeliveryPerson {
    del_id: number;
    name: string;
    phone: string;
    docs_exp: string;
    total_del: number;
    del_profile: string;
  }
  
  interface TrainDetails {
    platform: string;
    arrivalTime: string;
    departureTime: string;
    haltTime: string;
    orderDetails: Order;
  }
  
  interface Props {
    restdata: any;
  }


// --- START: Receipt Generation Code ---

// Helper function to format currency
const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number') return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

// Helper function to calculate totals for an order
const calculateOrderTotals = (items: MenuItem[]) => {
  if (!items || !Array.isArray(items)) return { subTotal: 0, gst: 0, grandTotal: 0, totalInWords: "Zero Only" };

  const subTotal = items.reduce(
    (sum, item) => sum + item.SellingPrice * item.quantity,
    0
  );

  const gstRate = 0.05; // 5%
  const gst = subTotal * gstRate;
  const grandTotal = subTotal + gst;
  
  // Simplified number to words converter
  const numberToWords = (num: number) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const numStr = num.toString();
    if (numStr.length > 9) return 'overflow';
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim().charAt(0).toUpperCase() + str.slice(1) + 'Only';
  };

  const totalInWords = numberToWords(Math.round(grandTotal));

  return { subTotal, gst, grandTotal, totalInWords };
};

// The Thermal Receipt layout component
const ThermalReceipt = React.forwardRef(({ order, totals }: { order: Order; totals: any }, ref: any) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}`;
  };
  
  const customerName = order.customer_info?.customerDetails?.customerName || "Guest";

  return (
    <Box
      ref={ref}
      sx={{ width: "300px", p: 1.5, fontFamily: "'Courier New', Courier, monospace", fontSize: "12px", color: "#000", backgroundColor: "#fff", boxSizing: 'border-box',height:'100%',overflowY:'scroll' }}
    >
      <Box textAlign="center" sx={{ mb: 1 }}>
        <Typography variant="h6" component="h1" sx={{ fontFamily: 'inherit', fontWeight: 'bold', fontSize: '18px' }}>{order.outlet_name}</Typography>
        <Typography sx={{ fontFamily: 'inherit', fontSize: '11px' }}>{order.address}, {order.city}</Typography>
        <Typography sx={{ fontFamily: 'inherit', fontSize: '11px' }}>Phone: {order.phone}</Typography>
        <Typography sx={{ fontFamily: 'inherit', fontSize: '11px' }}>GSTIN: {order.gst}</Typography>
        <Typography sx={{ fontFamily: 'inherit', fontSize: '11px' }}>FSSAI: {order.fssai}</Typography>
        <Typography variant="h6" component="h2" sx={{ fontFamily: 'inherit', fontWeight: 'bold', mt: 1, fontSize: '14px' }}>TAX INVOICE</Typography>
      </Box>

      <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
      
      <Box>
        <p><strong>Order No:</strong> {order.oid}</p>
        <p><strong>Date:</strong> {formatDate(order.created_at)}</p>
        <p><strong>Billed to:</strong> {customerName}</p>
        {order.delivery_details?.deliveryDetails && (
          <p><strong>Delivery:</strong> Train {order.delivery_details.deliveryDetails.trainNo}, C-{order.delivery_details.deliveryDetails.coach}, B-{order.delivery_details.deliveryDetails.berth}</p>
        )}
      </Box>

      <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit', fontSize: '12px' }}>
        <thead><tr><th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th><th style={{ textAlign: 'center', padding: '2px 0' }}>Qty</th><th style={{ textAlign: 'right', padding: '2px 0' }}>Rate</th><th style={{ textAlign: 'right', padding: '2px 0' }}>Amount</th></tr></thead>
        <tbody>
          {order.menu_items?.items?.map((item, index) => (
            <tr key={index}>
              <td style={{ textAlign: 'left', padding: '2px 0' }}>{item.name}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right' }}>{item.SellingPrice.toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{(item.SellingPrice * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
      
      <Box>
        <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontFamily: 'inherit' }}>Subtotal:</Typography><Typography sx={{ fontFamily: 'inherit' }}>{formatCurrency(totals.subTotal)}</Typography></Stack>
        <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontFamily: 'inherit' }}>GST @ 5%:</Typography><Typography sx={{ fontFamily: 'inherit' }}>{formatCurrency(totals.gst)}</Typography></Stack>
      </Box>

      <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
      
      <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
          <Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', fontSize: '14px' }}>GRAND TOTAL:</Typography><Typography sx={{ fontFamily: 'inherit', fontWeight: 'bold', fontSize: '14px' }}>{formatCurrency(totals.grandTotal)}</Typography>
      </Stack>
      <Typography sx={{ fontFamily: 'inherit', textTransform: 'capitalize', mt: 1, fontSize: '11px' }}>{totals.totalInWords}</Typography>

      {order.comment && (<><Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} /><p><strong>Notes:</strong> {order.comment}</p></>)}

      <Box textAlign="center" sx={{ mt: 2 }}><p>*** Thank You! Visit Again! ***</p><p>This is a computer-generated receipt.</p></Box>
    </Box>
  );
});

// --- END: Receipt Generation Code ---

// --- UPDATED STATUS TYPES AND GROUPS ---
const STATUS_TYPES = {
    ORDER_PLACED: 'Placed',           // <--- ADDED
    ORDER_CONFIRMED: 'Confirmed',     // <--- ADDED
    ORDER_PREPARING: 'Preparing',
    ORDER_PREPARED: 'Prepared',
    ORDER_OUT_FOR_DELIVERY: 'Out for Delivery',
    ORDER_DELIVERED: 'Delivered',
    ORDER_PARTIALLY_DELIVERED: 'Partially Delivered',
    ORDER_UNDELIVERED: 'Undelivered',
    ORDER_CANCELLED: 'Cancelled'
  };
  
  const STATUS_GROUPS = {
    // Added Placed and Confirmed to this group so they show up in the first tab
    'Preparing': ['ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_PREPARING', 'ORDER_PREPARED'], 
    'Out for Delivery': ['ORDER_OUT_FOR_DELIVERY'],
    'Delivered': ['ORDER_DELIVERED', 'ORDER_PARTIALLY_DELIVERED', 'ORDER_UNDELIVERED', 'ORDER_CANCELLED']
  };

const Orders: React.FC<Props> = ({ restdata }) => {
  // ... existing state variables
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [show, setShow] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [openTrainDialog, setOpenTrainDialog] = useState(false);
  const [openDeliveryDialog, setOpenDeliveryDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [trainDetails, setTrainDetails] = useState<TrainDetails | null>(null);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [deldetails,setdeldetails]=useState<any>(null);
  const [deliveryPersonsMap, setDeliveryPersonsMap] = useState<{[key: number]: DeliveryPerson}>({});
  
  // --- START: New State for Receipt ---
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [currentOrderForReceipt, setCurrentOrderForReceipt] = useState<Order | null>(null);
  const receiptRef = useRef(null);
  // --- END: New State for Receipt ---
  
  const outletId = useSelector((state: RootState) => state.outlet_id);
  const statusLabels = Object.keys(STATUS_GROUPS);

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get(`/restraunts/?outlet_id=${outletId?.outlet_id}`);
      const restaurantData = res?.data?.data?.rows[0];
      
      if (restaurantData) {
        const res1 = await axiosInstance.get(`/orders/?outlet_id=${outletId?.outlet_id}`);
        const apiOrders: Order[] = res1?.data?.data?.rows || [];
        
        const filteredByPushed = apiOrders.filter(order => order.pushed === 1);
        
        // Add restaurant logo to each order for the receipt
        const ordersWithLogo = filteredByPushed.map(order => ({
            ...order,
            logo_image: restaurantData.logo_image
        }));

        const sortedOrders = [...ordersWithLogo].sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime());
        
        setOrders(sortedOrders);
        filterOrdersByTab(tabIndex, sortedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  const filterOrdersByTab = (index: number, ordersList: Order[] = orders) => {
    const statusGroup = STATUS_GROUPS[statusLabels[index]];
    const filtered = ordersList.filter(order => statusGroup.includes(order.status));
    setFilteredOrders(filtered);
  };
  const fetchDeliveryPersonById = async (delId: number) => {
    try {
      const res = await axiosInstance.get(`/dels/?del_id=${delId}`);
      if (res?.data?.data?.rows && res.data.data.rows.length > 0) {
        const deliveryPerson = res.data.data.rows[0];
        setDeliveryPersonsMap(prevMap => ({
          ...prevMap,
          [delId]: deliveryPerson
        }));
      }
    } catch (error) {
      console.error("Error fetching delivery person:", error);
    }
  };
  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersons();
  }, []);

  useEffect(() => {
    filterOrdersByTab(tabIndex);
  }, [tabIndex, orders]);
  useEffect(() => {
    filteredOrders?.forEach(order => {
      if (order.del_id && !deliveryPersonsMap[order.del_id]) {
        fetchDeliveryPersonById(order.del_id);
      }
    });
  }, [filteredOrders]);

  const fetchDeliveryPersons = async () => {
    try {
      const res = await axiosInstance.get(`/dels/?outlet_id=${outletId?.outlet_id}`);
      if (res?.data?.data?.rows) {
        setDeliveryPersons(res.data.data.rows);
      }
    } catch (error) {
      console.error("Error fetching delivery persons:", error);
    }
  };
  const handleShowTrain = async (order: any) => {
    setOpenTrainDialog(true);
    try {
      const res = await axiosInstance.get(`/traindetail/${order.delivery_details.deliveryDetails.trainNo}`);
      const thedata = res?.data?.trainRoutes?.find(
        (route: any) => route.stationCode == order.station_code
      );
      setTrainDetails({ 
        ...thedata, 
        orderDetails: order 
      });
    } catch (error) {
      console.error("Error fetching train details:", error);
    }
  };
  const handleOpenStatusDialog = (order: Order) => {
    setCurrentOrder(order);
    setNewStatus(order.status);
    setOpenStatusDialog(true);
  };
const pushStatusToIRCTC = async (orderId, status, orderItems, deliveryPerson) => {
  try {
    const formattedItems = orderItems?.map(item => ({
      itemId: item.item_id,
      quantity: item.quantity
    }));
    const payload:any = {
      status: status,
      otp: "1234",
      orderItems: formattedItems,
      deliveryPersonContactNo: null,
      deliveryPersonName: null
    };
    if (status === "ORDER_UNDELIVERED" || status === "ORDER_CANCELLED") {
      payload.remarks = "LAW_N_ORDER";
    }
    if (deliveryPerson) {
      payload.deliveryPersonContactNo = deliveryPerson.phone;
      payload.deliveryPersonName = deliveryPerson.name;
    }
    const response = await axiosInstance.post(`/push-status/${orderId}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error pushing status to IRCTC:", error);
    throw error;
  }
};
const handleStatusChange = async (status: string) => {
  if (!currentOrder) return;
  try {
    if (status === 'ORDER_OUT_FOR_DELIVERY' || status === 'ORDER_PARTIALLY_DELIVERED' || status ==="ORDER_DELIVERED") {
      setOpenStatusDialog(false);
      setOpenDeliveryDialog(true);
      return;
    }
    const res =  await pushStatusToIRCTC(
      currentOrder.oid, 
      status, 
      currentOrder.menu_items.items,
      currentOrder.del_id ? deliveryPersonsMap[currentOrder.del_id] : null
    );
    if(res.status){
    await axiosInstance.put(`/order/${currentOrder.oid}`, { status });
    setOpenStatusDialog(false);
    fetchOrders();
    }
    else{
      alert("order push failed on irctc!");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
  }
};
const handleAssignDelivery = async (delId: number, person: any) => {
  if (!currentOrder) return;
  try {
    setdeldetails(person);
 const res =   await pushStatusToIRCTC(
      currentOrder.oid,
      'ORDER_OUT_FOR_DELIVERY',
      currentOrder.menu_items.items,
      person
    );
    if(res.status){
    await axiosInstance.put(`/order/${currentOrder.oid}`, { 
      del_id: delId, 
      status: 'ORDER_OUT_FOR_DELIVERY' 
    });
    setOpenDeliveryDialog(false);
    fetchOrders();
    }
    else{
      alert("order push failed on irctc!");
    }
  } catch (error) {
    console.error("Error assigning delivery person:", error);
  }
};
const getMinutesLeft = (arrivalTime: string): number => {
    if (!arrivalTime) return 0;
    const [hours, mins] = arrivalTime.split(':').map(Number);
    const now = new Date();
    const arrivalTotalMinutes = (hours * 60) + mins;
    const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();
    let minutesDifference = arrivalTotalMinutes - currentTotalMinutes;
    if (minutesDifference < 0) minutesDifference += 24 * 60;
    return minutesDifference;
};
const getTimeLeft = (arrivalTime: string): string => {
    if (!arrivalTime) return "Unknown";
    const minutes = getMinutesLeft(arrivalTime);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')} hrs`;
    }
    return minutes > 0 ? `${minutes} min` : "Arriving";
};
function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
}
const formatDeliveryDate = (dateString: string) => {
    const datepart = dateString.split(" ")[0];
    return  `${formatDate(datepart)} At ${dateString.split(" ")[1]}`
};
const getDeliveryTimeLeft = (deliveryDate: string) => {
    try {
        const now = new Date();
        const delivery = new Date(deliveryDate.replace(' IST', ''));
        const diffMs = delivery.getTime() - now.getTime();
        if (diffMs <= 0) return "Due now";
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} min left`;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m left`;
    } catch (e) {
        return "Invalid date";
    }
};

  // --- UPDATED ICON LOGIC ---
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'ORDER_PLACED': return <FiberNew fontSize="small" />; // New icon
      case 'ORDER_CONFIRMED': return <ThumbUp fontSize="small" />; // New icon
      case 'ORDER_PREPARING': return <AccessTime fontSize="small" />;
      case 'ORDER_PREPARED': return <CheckCircle fontSize="small" />;
      case 'ORDER_OUT_FOR_DELIVERY': return <LocalShipping fontSize="small" />;
      case 'ORDER_DELIVERED': return <DoneAll fontSize="small" />;
      case 'ORDER_CANCELLED': return <Cancel fontSize="small" />;
      default: return <AccessTime fontSize="small" />;
    }
  };
  const getOrderCountByTab = (index: number) => {
    const statusGroup = STATUS_GROUPS[statusLabels[index]];
    return orders.filter(order => statusGroup.includes(order.status)).length;
  };

  // --- START: Receipt Handlers ---
  const handleOpenReceipt = (order: Order) => {
    setCurrentOrderForReceipt(order);
    setReceiptOpen(true);
  };

  const handleCloseReceipt = () => {
    setReceiptOpen(false);
    setCurrentOrderForReceipt(null);
  };

  const generatePDF = async () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) return;

    try {
      const canvas = await html2canvas(receiptElement, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const receiptWidthPt = 227; 
      const receiptHeightPt = (canvas.height * receiptWidthPt) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [receiptWidthPt, receiptHeightPt] });
      pdf.addImage(imgData, 'PNG', 0, 0, receiptWidthPt, receiptHeightPt);
      pdf.save(`Receipt_${currentOrderForReceipt?.oid || 'receipt'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF.");
    }
  };
  // --- END: Receipt Handlers ---

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header remains the same */}
   

      {show === 0 ? (
        <Stack px={2}>
          {/* Tabs remain the same */}
          <Tabs value={tabIndex} onChange={(_, newIndex: number) => setTabIndex(newIndex)} variant="scrollable" textColor="primary" indicatorColor="primary" sx={{ bgcolor: '#F5F5F5', borderRadius: 2, width: '100%' }}>
            {statusLabels.map((label, index) => (
              <Tab key={label} sx={{ fontFamily: "font-katibeh" }} label={<Chip label={`${label} (${getOrderCountByTab(index)})`} color={index === tabIndex ? "primary" : "default"} />} />
            ))}
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {filteredOrders.length === 0 ? (
              <Typography fontFamily="font-katibeh" textAlign="center" color="text.secondary">No orders available</Typography>
            ) : (
              filteredOrders?.map((order) => (
                <Card key={order.oid} sx={{ mb: 2, borderRadius: 3 }} variant="outlined">
                  <CardContent>
                    {/* --- Order Card Top Section --- */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontFamily="font-katibeh" variant="subtitle2" color="text.secondary">Order ID: <b>#{order.oid}</b></Typography>
                      <Stack direction="row" alignItems="center">
                        <Chip icon={getStatusIcon(order.status)} label={STATUS_TYPES[order.status as keyof typeof STATUS_TYPES]} color={ order.status === 'ORDER_CANCELLED' ? 'error' : order.status === 'ORDER_DELIVERED' ? 'success' : order.status === 'ORDER_OUT_FOR_DELIVERY' ? 'primary' : 'warning' } size="small" />
                        {/* --- ADDED RECEIPT BUTTON --- */}
                        <IconButton size="small" sx={{ ml: 1 }} onClick={() => handleOpenReceipt(order)}>
                          <Receipt color="action" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    {/* Rest of the order card content remains the same */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                      <Typography fontFamily="font-katibeh" variant="body2">{order.customer_info.customerDetails.customerName} • {order.customer_info.customerDetails.mobile}</Typography>
                      <Chip icon={<AccessTime fontSize="small" />} label={getDeliveryTimeLeft(order.delivery_date)} color="primary" size="small" variant="outlined" />
                    </Stack>
                    <Typography fontFamily="font-katibeh" variant="caption" color="text.secondary">Delivery: {formatDeliveryDate(order.delivery_date)}</Typography>
                    {order.del_id && deliveryPersonsMap[order.del_id] && (<Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}><Stack direction="row" alignItems="center" spacing={1}><Avatar src={deliveryPersonsMap[order.del_id].del_profile} alt={deliveryPersonsMap[order.del_id].name} sx={{ width: 32, height: 32 }} /><Box><Typography fontFamily="font-katibeh" variant="body2" fontWeight="bold">Delivery: {deliveryPersonsMap[order.del_id].name}</Typography><Typography fontFamily="font-katibeh" variant="caption">{deliveryPersonsMap[order.del_id].phone}</Typography></Box></Stack></Box>)}
                    <Divider sx={{ my: 1 }} />
                    {order.menu_items.items.map((item, index) => (<Stack key={index} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}><Box><Typography fontFamily="font-katibeh">{item.name} x {item.quantity}</Typography>{item.isVegetarian && (<Chip label="Veg" size="small" color="success" sx={{ mr: 1, height: 20 }} />)}</Box><Typography fontFamily="font-katibeh" fontWeight="bold">₹{item.SellingPrice * item.quantity}</Typography></Stack>))}
                    {order.comment && (<Typography fontFamily="font-katibeh" variant="body2" color="text.secondary" sx={{ mt: 1 }}><b>Note:</b> {order.comment}</Typography>)}
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" justifyContent="space-between"><Typography fontFamily="font-katibeh" variant="subtitle2" color="text.secondary">Payment: {order.mode}</Typography><Typography fontFamily="font-katibeh" fontWeight="bold" color="success.main">₹{order.menu_items.items.reduce((total, item) => total + (item.SellingPrice * item.quantity), 0)}</Typography></Stack>
                    <Stack spacing={1} mt={2}>
                      <Button variant="contained" fullWidth sx={{ padding: 2, bgcolor: '#FCE9E4', color: '#D86E47', '&:hover': { bgcolor: '#F5C6A5' } }} startIcon={<Visibility />} onClick={() => handleShowTrain(order)}><Typography fontFamily="font-katibeh">View Train Details</Typography></Button>
                      <Button variant="contained" fullWidth sx={{ padding: 2, bgcolor: '#E87C4E', '&:hover': { bgcolor: '#D86E47' } }} startIcon={<CheckCircle />} onClick={() => handleOpenStatusDialog(order)}><Typography fontFamily="font-katibeh">Update Status</Typography></Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Stack>
      ) : show === 1 ? ( <Notification /> ) : ( <Wallet /> )}

      {/* Existing Dialogs (Train, Status, Delivery) remain the same */}
      <Dialog open={openTrainDialog} onClose={() => setOpenTrainDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Train Details</DialogTitle>
        <DialogContent dividers>{trainDetails && (<Stack spacing={1}>{getMinutesLeft(trainDetails.arrivalTime) > 0 && (<Chip icon={<AccessTime fontSize="large" />} label={`${getTimeLeft(trainDetails.arrivalTime)} left`} color="warning" size="small" />)}<Typography variant="body1">Train Name: {trainDetails.orderDetails.delivery_details.deliveryDetails.trainNo}</Typography><Typography variant="body1">Train Number: {trainDetails.orderDetails.delivery_details.deliveryDetails.trainNo}</Typography><Typography variant="body1">Platform: {trainDetails.platform || 'Not assigned'}</Typography><Typography variant="body1">ETA: {trainDetails.arrivalTime || 'N/A'}</Typography><Typography variant="body1">DTA: {trainDetails.departureTime || 'N/A'}</Typography><Typography variant="body1">HALT TIME: {trainDetails.haltTime || 'N/A'}</Typography><Divider sx={{ my: 1 }} /><Typography variant="subtitle1" fontWeight="bold">Passenger Details</Typography><Typography variant="body2">Coach: {trainDetails.orderDetails.delivery_details.deliveryDetails.coach}</Typography><Typography variant="body2">Berth: {trainDetails.orderDetails.delivery_details.deliveryDetails.berth}</Typography><Typography variant="body2">PNR: {trainDetails.orderDetails.delivery_details.deliveryDetails.pnr}</Typography><Typography variant="body2">Passengers: {trainDetails.orderDetails.delivery_details.deliveryDetails.passengerCount}</Typography></Stack>)}</DialogContent>
        <DialogActions><Button onClick={() => setOpenTrainDialog(false)}>Close</Button></DialogActions>
      </Dialog>
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} label="Status">
                    {/* ADDED NEW STATUS OPTIONS HERE */}
                    <MenuItem value="ORDER_PLACED">Placed</MenuItem>
                    <MenuItem value="ORDER_CONFIRMED">Confirmed</MenuItem>
                    <MenuItem value="ORDER_PREPARING">Preparing</MenuItem>
                    <MenuItem value="ORDER_PREPARED">Prepared</MenuItem>
                    <MenuItem value="ORDER_OUT_FOR_DELIVERY">Out for Delivery</MenuItem>
                    <MenuItem value="ORDER_DELIVERED">Delivered</MenuItem>
                    <MenuItem value="ORDER_PARTIALLY_DELIVERED">Partially Delivered</MenuItem>
                    <MenuItem value="ORDER_UNDELIVERED">Undelivered</MenuItem>
                    <MenuItem value="ORDER_CANCELLED">Cancelled</MenuItem>
                </Select>
            </FormControl>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button><Button onClick={() => handleStatusChange(newStatus)} variant="contained" color="primary">Update</Button></DialogActions>
      </Dialog>
      <Dialog open={openDeliveryDialog} onClose={() => setOpenDeliveryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Delivery Person</DialogTitle>
        <DialogContent dividers><Stack spacing={2}>{deliveryPersons.length === 0 ? (<Typography>No delivery persons available</Typography>) : (deliveryPersons.map((person) => (<Card key={person.del_id} sx={{ display: 'flex', p: 2, justifyContent: 'space-between', gap: 1, flexDirection: { xs: 'row', sm: 'row' } }}><Avatar src={person.del_profile} alt={person.name} sx={{ height: 50, width: 50, objectFit: 'contain' }} /><CardContent sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, p: 0 }}><Box><Typography variant="subtitle1" fontWeight="bold">{person.name}</Typography><Typography variant="body2">{person.phone}</Typography><Typography variant="body2">Pass Expiry: {person.docs_exp}</Typography><Typography variant="body2">Deliveries: {person.total_del}</Typography></Box><Button sx={{ mt: 2 }} variant="contained" onClick={() => handleAssignDelivery(person.del_id,person)}>Assign</Button></CardContent></Card>)))}</Stack></DialogContent>
        <DialogActions><Button onClick={() => setOpenDeliveryDialog(false)}>Cancel</Button></DialogActions>
      </Dialog>

      {/* --- START: New Receipt Dialog --- */}
      <Dialog open={receiptOpen} onClose={handleCloseReceipt} maxWidth="xs">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Typography variant="h6" fontWeight={600}>Receipt Preview</Typography>
          <IconButton onClick={handleCloseReceipt} edge="end"><Close /></IconButton>
        </Box>
        <DialogContent sx={{ p: 2, bgcolor: "#f5f5f5", display: 'flex', justifyContent: 'center' }}>
          {currentOrderForReceipt && (
            <Paper elevation={3} sx={{ overflow: 'hidden' }}>
              <ThermalReceipt
                ref={receiptRef}
                order={currentOrderForReceipt}
                totals={calculateOrderTotals(currentOrderForReceipt.menu_items.items)}
              />
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={handleCloseReceipt} color="inherit">Close</Button>
          <Button onClick={generatePDF} variant="contained" startIcon={<FileDownload />}>Download PDF</Button>
        </DialogActions>
      </Dialog>
      {/* --- END: New Receipt Dialog --- */}

      <DashboardDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
};

export default Orders;