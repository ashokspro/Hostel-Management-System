// src/api/gatepassApi.js

import axiosInstance from './axiosInstance';

const gatepassApi = {
    // GET /api/gatepasses/{pass_id}/download
    // Returns a PDF blob — triggers browser download
    async downloadPDF(passId, passNumber) {
        const res = await axiosInstance.get(
            `/api/gatepasses/${passId}/download`,
            { responseType: 'blob' } // tells axios to expect binary data, not JSON
        );

        // Create a temporary download link and click it programmatically
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `GatePass_${passNumber || passId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url); // free memory
    },
};

export default gatepassApi;