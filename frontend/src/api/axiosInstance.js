// src/api/axiosInstance.js

import axios from 'axios';
import tokenHelper from '../utils/tokenHelper';

// Create a custom Axios instance
// baseURL means every call uses this as the prefix
// So axios.get('/api/student/profile') becomes
// GET http://localhost:5173/api/student/profile
// which Vite's proxy forwards to http://localhost:8000/api/student/profile
const axiosInstance = axios.create({
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds — fail fast if backend is down
});


// ── REQUEST INTERCEPTOR ───────────────────────────────────
// Runs automatically BEFORE every single API call
// Perfect place to attach the JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = tokenHelper.getToken();

        // If a token exists, attach it to every request header
        // FastAPI's OAuth2PasswordBearer reads this automatically
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config; // must return config or the request won't proceed
    },
    (error) => {
        // Request failed before it was even sent (network issue etc.)
        return Promise.reject(error);
    }
);


// ── RESPONSE INTERCEPTOR ──────────────────────────────────
// Runs automatically AFTER every single API response
// Perfect place to handle global errors like expired tokens
axiosInstance.interceptors.response.use(
    (response) => {
        // 2xx responses — just pass through
        return response;
    },
    (error) => {
        const status = error.response?.status;

        // 401 = Unauthorized — token expired or invalid
        // Clear storage and redirect to login
        if (status === 401) {
            tokenHelper.clear();
            // Hard redirect — clears all React state too
            window.location.href = '/login';
        }

        // 403 = Forbidden — wrong role tried to access a route
        // Let individual components handle this with their own error messages
        // We just pass it through

        return Promise.reject(error);
    }
);

export default axiosInstance;