// src/api/adminApi.js

import axiosInstance from './axiosInstance';

const adminApi = {
    // POST /api/admin/users — create any user type
    async createUser(data) {
        const res = await axiosInstance.post('/api/admin/users', data);
        return res.data;
    },

    // GET /api/admin/users — list students (with filters)
    async getStudents(filters = {}) {
        const params = new URLSearchParams();
        if (filters.search)   params.append('search', filters.search);
        if (filters.year)     params.append('year', filters.year);
        if (filters.course)   params.append('course', filters.course);
        if (filters.is_active !== undefined && filters.is_active !== '') {
            params.append('is_active', filters.is_active);
        }
        const res = await axiosInstance.get(`/api/admin/users?${params.toString()}`);
        return res.data;
    },

    // GET /api/admin/wardens
    async getWardens() {
        const res = await axiosInstance.get('/api/admin/wardens');
        return res.data;
    },

    // GET /api/admin/security
    async getSecurity() {
        const res = await axiosInstance.get('/api/admin/security');
        return res.data;
    },

    // GET /api/admin/users/{user_id}
    async getUser(userId) {
        const res = await axiosInstance.get(`/api/admin/users/${userId}`);
        return res.data;
    },

    async getAdmins() {
        const res = await axiosInstance.get('/api/admin/admins');
        return res.data;
    },
    
    // PUT /api/admin/users/{user_id}
    async updateUser(userId, data) {
        const res = await axiosInstance.put(`/api/admin/users/${userId}`, data);
        return res.data;
    },

    // PUT /api/admin/users/{user_id}/activate
    async activateUser(userId) {
        const res = await axiosInstance.put(`/api/admin/users/${userId}/activate`);
        return res.data;
    },

    // PUT /api/admin/users/{user_id}/deactivate
    async deactivateUser(userId) {
        const res = await axiosInstance.put(`/api/admin/users/${userId}/deactivate`);
        return res.data;
    },

    async resetUserPassword(userId, newPassword = null) {
    const res = await axiosInstance.put(`/api/admin/users/${userId}/reset-password`, {
        new_password: newPassword,
    });
    return res.data;
},
async getStats() {
    const res = await axiosInstance.get('/api/admin/stats');
    return res.data;
},
};

export default adminApi;