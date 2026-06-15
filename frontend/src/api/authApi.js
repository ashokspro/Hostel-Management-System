// src/api/authApi.js

import axiosInstance from './axiosInstance';

const authApi = {

    // POST /api/auth/login
    // Returns: { access_token, token_type, user_type, id }
    async login(id, password) {
        const response = await axiosInstance.post('/api/auth/login', {
            id,
            password
        });
        return response.data;
    },

    async forgotPassword(email) {
    const res = await axiosInstance.post('/api/auth/forgot-password', { email });
    return res.data;
},

async resetPassword(token, newPassword) {
    const res = await axiosInstance.post('/api/auth/reset-password', {
        token,
        new_password: newPassword,
    });
    return res.data;
},

async changePassword(currentPassword, newPassword) {
    const res = await axiosInstance.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
    });
    return res.data;
},

    
};



export default authApi;