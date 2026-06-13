// src/api/securityApi.js

import axiosInstance from './axiosInstance';

const securityApi = {
    // GET /api/security/gatepasses — all approved passes
    async getApproved() {
        const res = await axiosInstance.get('/api/security/gatepasses');
        return res.data;
    },

    // GET /api/security/gatepasses/out — students currently outside
    async getCurrentlyOut() {
        const res = await axiosInstance.get('/api/security/gatepasses/out');
        return res.data;
    },

    // PUT /api/security/gatepasses/{pass_id}/exit
    async markExit(passId, remarks) {
        const res = await axiosInstance.put(
            `/api/security/gatepasses/${passId}/exit`,
            { security_remarks: remarks || null }
        );
        return res.data;
    },

    // PUT /api/security/gatepasses/{pass_id}/return
    async markReturn(passId, remarks) {
        const res = await axiosInstance.put(
            `/api/security/gatepasses/${passId}/return`,
            { security_remarks: remarks || null }
        );
        return res.data;
    },
};

export default securityApi;