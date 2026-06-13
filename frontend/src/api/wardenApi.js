// src/api/wardenApi.js

import axiosInstance from './axiosInstance';

const wardenApi = {
    // ── Students ──────────────────────────────────────────
    // GET /api/warden/students?search=&year=&course=
    async getStudents(filters = {}) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.year)   params.append('year', filters.year);
        if (filters.course) params.append('course', filters.course);

        const res = await axiosInstance.get(`/api/warden/students?${params.toString()}`);
        return res.data;
    },

    // GET /api/warden/students/{student_id}
    async getStudent(studentId) {
        const res = await axiosInstance.get(`/api/warden/students/${studentId}`);
        return res.data;
    },

    // ── Gate passes ───────────────────────────────────────
    // GET /api/warden/gatepasses/pending
    async getPending() {
        const res = await axiosInstance.get('/api/warden/gatepasses/pending');
        return res.data;
    },

    // GET /api/warden/gatepasses
    async getAllGatePasses() {
        const res = await axiosInstance.get('/api/warden/gatepasses');
        return res.data;
    },

    // PUT /api/warden/gatepasses/{pass_id}/approve
    async approve(passId, remarks) {
        const res = await axiosInstance.put(
            `/api/warden/gatepasses/${passId}/approve`,
            { status: 'Approved', remarks: remarks || null }
        );
        return res.data;
    },

    // PUT /api/warden/gatepasses/{pass_id}/reject
    async reject(passId, remarks) {
        const res = await axiosInstance.put(
            `/api/warden/gatepasses/${passId}/reject`,
            { status: 'Rejected', remarks: remarks || null }
        );
        return res.data;
    },
};

export default wardenApi;