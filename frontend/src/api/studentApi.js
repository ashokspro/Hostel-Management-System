// src/api/studentApi.js

import axiosInstance from './axiosInstance';

const studentApi = {
    // GET /api/student/profile
    async getProfile() {
        const res = await axiosInstance.get('/api/student/profile');
        return res.data;
    },

    // PUT /api/student/profile
    // data — only the fields being changed (PATCH semantics on backend)
    async updateProfile(data) {
        const res = await axiosInstance.put('/api/student/profile', data);
        return res.data;
    },

    // GET /api/student/gatepasses
    async getGatePasses() {
        const res = await axiosInstance.get('/api/student/gatepasses');
        return res.data;
    },

    // POST /api/student/gatepasses
    async createGatePass(data) {
        const res = await axiosInstance.post('/api/student/gatepasses', data);
        return res.data;
    },

    // GET /api/student/gatepasses/{pass_id}
    async getGatePass(passId) {
        const res = await axiosInstance.get(`/api/student/gatepasses/${passId}`);
        return res.data;
    },

    async getStats() {
    const res = await axiosInstance.get('/api/student/gatepasses/stats');
    return res.data;
},
};

export default studentApi;