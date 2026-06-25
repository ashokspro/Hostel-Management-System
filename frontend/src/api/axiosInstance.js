// src/api/axiosInstance.js

import axios from 'axios';
import tokenHelper from '../utils/tokenHelper';

// Create a custom Axios instance
// baseURL means every call uses this as the prefix
// So axios.get('/api/student/profile') becomes
// GET http://localhost:5173/api/student/profile
// which Vite's proxy forwards to http://localhost:8000/api/student/profile
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
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
// src/api/axiosInstance.js

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response?.status;

        // Don't auto-redirect on login failures — let Login.jsx handle the error
        const isLoginRequest = error.config?.url?.includes('/api/auth/login');

        if (status === 401 && !isLoginRequest) {
            tokenHelper.clear();
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;