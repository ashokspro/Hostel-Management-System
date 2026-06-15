// src/utils/errorHelper.js

export function extractErrorMessage(err, fallback = 'Something went wrong.') {
    const detail = err.response?.data?.detail;

    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail[0]?.msg || fallback;
    if (!err.response) return 'Cannot connect to server.';

    return fallback;
}