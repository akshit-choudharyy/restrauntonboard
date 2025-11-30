import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, TextField, Button, Typography, Box, Stack, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../store/authSlice';
import type { RootState } from '../store/store';
import { useToast } from '../hooks/use-toast';
import React from 'react';
import axiosInstance from '../interceptor/axiosInstance';

export default function Login() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '']); // Four separate OTP inputs
  const [showOTP, setShowOTP] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, seterror] = useState("");
  const otpExpiry = Date.now() + 120000;

  useEffect(() => {
    if (otpExpiry) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showOTP]);

const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }

    // --- BYPASS: Comment out the API call ---
    // const res = await axiosInstance.post("/send-otp", { "mobile": phone });
    // console.log(res?.data?.data?.otp);

    // --- Simulate Success ---
    toast({
      title: "Testing Mode",
      description: "OTP sending skipped. Please use '1234' to verify."
    });
    
    setShowOTP(true);
    setTimeLeft(120);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && !isNaN(Number(value))) {
      const newOtpInput = [...otpInput];
      newOtpInput[index] = value;
      setOtpInput(newOtpInput);

      // Move to next box automatically
      if (value && index < 3) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }

      // Trigger verification when last box is filled
      if (index === 3 && value.length === 1) {
        handleVerifyOTP(newOtpInput.join(''));
      }
    }
  };

  // Handle backspace key navigation
  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Backspace') {
      if (!otpInput[index] && index > 0) {
        document.getElementById(`otp-${index - 1}`)?.focus();
      }
    } else if (event.ctrlKey && event.key === 'Backspace') {
      setOtpInput(['', '', '', '']); // Clear all fields
      document.getElementById(`otp-0`)?.focus(); // Focus on the first field
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    // --- BYPASS: Comment out the backend verification ---
    // const res = await axiosInstance.post(`/verify-otp`, { "mobile": phone, otp });

    // --- HARDCODED CHECK ---
    if (otp === "1234") {
      toast({
        title: "Success",
        description: "OTP verified successfully (Testing)"
      });

      // Since we skipped the API, we don't have database rows.
      // We manually set the user with just the phone number.
      dispatch(setUser({ "mobile": phone }));
      
      navigate('/register');
    }
    else {
      toast({
        title: "Invalid OTP",
        description: "For testing, please use 1234",
        variant: "destructive"
      });
      seterror("Invalid Otp or expired!")
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Section - Image and Animation */}
      <Box
        sx={{
          flex: { xs: 0, md: 1 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, rgba(235, 128, 65, 0.9), rgba(235, 128, 65, 0.7)), 
                      url(https://rishikeshcamps.in/wp-content/uploads/2023/05/restaarant.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' }
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '60%',
            right: '15%',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            animation: 'float 4s ease-in-out infinite reverse',
          }}
        />
        
        {/* Main Content */}
        <Box sx={{ textAlign: 'center', zIndex: 2, px: 4 }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "font-katibeh",
              fontSize: { md: '3.5rem', lg: '4rem' },
              color: 'white',
              fontWeight: 'bold',
              mb: 2,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            Welcome to <span style={{ color: '#FFE4B5' }}>OLF</span>
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: "font-katibeh",
              fontSize: { md: '1.5rem', lg: '2rem' },
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 4,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            Your Partner in Food Service Excellence
          </Typography>
          
          {/* Feature Icons */}
          <Stack direction="row" spacing={4} justifyContent="center" sx={{ mt: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  mx: 'auto'
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>📱</Typography>
              </Box>
              <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                Order Management
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  mx: 'auto'
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>🍽️</Typography>
              </Box>
              <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                Menu Updates
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  mx: 'auto'
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>🚉</Typography>
              </Box>
              <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                Passenger Service
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Right Section - Login Form */}
      <Box
        sx={{
          flex: { xs: 1, md: 1 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: { xs: `linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.3), transparent), 
                              url(https://rishikeshcamps.in/wp-content/uploads/2023/05/restaarant.jpg)`, md: '#f8f9fa' },
          backgroundSize: { xs: "cover", md: "none" },
          backgroundPosition: { xs: "center", md: "none" },
          px: { xs: 2, md: 4 },
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              width: '100%',
              maxWidth: 450,
              mx: 'auto',
              borderRadius: { xs: '40px 40px 0 0', md: '16px' },
              boxShadow: { xs: 'none', md: '0 8px 32px rgba(0,0,0,0.1)' },
              background: { xs: 'white', md: 'white' },
              position: { xs: 'fixed', md: 'static' },
              bottom: { xs: 0, md: 'auto' },
              left: { xs: 0, md: 'auto' },
              right: { xs: 0, md: 'auto' },
              height: { xs: '70vh', md: 'auto' }
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={2}>
                <Box sx={{ textAlign: { xs: 'left', md: 'center' }, mb: 2 }}>
                  <Typography
                    sx={{
                      fontFamily: "font-katibeh",
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      fontWeight: 'bold',
                      color: '#333',
                      mb: 1
                    }}
                  >
                    Partner with <span style={{ color: '#EB8041' }}>OLF</span>
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "font-katibeh",
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      fontWeight: 'bold',
                      color: '#333',
                      mt: -1,
                      mb: 2
                    }}
                  >
                    Store & Serve More!
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "font-katibeh",
                      fontSize: '1.1rem',
                      color: 'gray',
                      letterSpacing: 0.5
                    }}
                  >
                    Login to manage orders, update menus, and serve passengers with ease.
                  </Typography>
                </Box>

                {!showOTP ? (
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      variant="outlined"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      inputProps={{ maxLength: 10 }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused fieldset': {
                            borderColor: '#EB8041'
                          }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#EB8041'
                        }
                      }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSendOTP}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        borderRadius: 2,
                        bgcolor: '#EB8041',
                        '&:hover': {
                          bgcolor: '#d16f35'
                        },
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Send OTP
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={3}>
                    <Typography
                      variant="h6"
                      sx={{
                        textAlign: 'center',
                        color: '#333',
                        fontWeight: 600
                      }}
                    >
                      Enter OTP
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                      {otpInput.map((digit, index) => (
                        <TextField
                          key={index}
                          id={`otp-${index}`}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          variant="outlined"
                          type="tel"
                          inputProps={{ maxLength: 1, style: { textAlign: 'center' } }}
                          sx={{
                            width: '4rem',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&.Mui-focused fieldset': {
                                borderColor: '#EB8041'
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                    {error && (
                      <Typography sx={{ textAlign: 'center', color: 'red', fontSize: '0.9rem' }}>
                        {error}
                      </Typography>
                    )}
                    {timeLeft !== 0 && (
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: 'center',
                          color: 'text.secondary'
                        }}
                      >
                        Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </Typography>
                    )}
                    {timeLeft === 0 && (
                      <Button
                        fullWidth
                        variant="text"
                        onClick={handleSendOTP}
                        sx={{
                          color: '#EB8041',
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Resend OTP
                      </Button>
                    )}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}