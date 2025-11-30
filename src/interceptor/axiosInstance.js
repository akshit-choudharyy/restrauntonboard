import axios from 'axios';
// import { isTokenExpired } from '../../utils/isTokenExpired';
// https://olf-olf-backend.kxkfin.easypanel.host/api/v1
// http://localhost:5008/api/v1/
// Create the Axios instance
const axiosInstance = axios.create({
  // baseURL: "http://localhost:5008/api/v1/",
  baseURL: "https://olf-olf-backend.kxkfin.easypanel.host/api/v1",
  headers: { 'Content-Type': 'application/json' },
});


// Add an interceptor to include the token and handle expiration
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    // const token = localStorage.getItem('token');

    // // Check if the token is expired
    // if (token && isTokenExpired(token)) {
    //   // If expired, remove the token and redirect to login
    //   localStorage.removeItem('token');
    //   window.location.href = '/login'; // Redirect to the login page
    //   return Promise.reject(new Error('Token expired')); // Prevent the request
    // }

    // If token exists and is valid, add it to the Authorization header
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    // Handle any error during the request setup
    return Promise.reject(error);
  }
);

export default axiosInstance;
