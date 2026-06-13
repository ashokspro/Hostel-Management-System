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
    }
};

export default authApi;