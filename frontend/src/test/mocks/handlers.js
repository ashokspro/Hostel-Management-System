// src/test/mocks/handlers.js

import { http, HttpResponse } from 'msw';

// ── Test fixtures ──────────────────────────────────────────
export const mockUsers = {
    student: {
        id: 'STU001', name: 'Test Student', user_type: 'student',
        email: 'student@test.com', phone: '9876543210',
        room: '101', course: 'CS', year: '2nd Year',
        guardian_name: 'Parent Name', guardian_phone: '9876543211',
        is_active: true,
    },
    warden: {
        id: 'WARDEN001', name: 'Test Warden', user_type: 'warden',
        email: 'warden@test.com', phone: '9876543212',
        is_active: true,
    },
    security: {
        id: 'SECURITY001', name: 'Test Security', user_type: 'security',
        email: 'security@test.com', phone: '9876543213',
        is_active: true,
    },
    admin: {
        id: 'ADMIN001', name: 'Test Admin', user_type: 'admin',
        email: 'admin@test.com', phone: '9876543214',
        is_active: true,
    },
};

export const mockGatePass = {
    pass_id: 'pass-123',
    pass_number: 'GP-260617-001',
    student_id: 'STU001',
    student_name: 'Test Student',
    room_no: '101',
    reason: 'Going home',
    going_place: 'Chennai',
    out_date: '2026-06-20',
    out_time: '10:00:00',
    return_date: '2026-06-21',
    return_time: '18:00:00',
    status: 'Pending',
    exit_status: 'In',
    remarks: null,
    actual_out_time: null,
    actual_return_time: null,
    created_at: '2026-06-17T08:00:00Z',
};

export const handlers = [
    // ── Auth ────────────────────────────────────────────────
    http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json();

        const userMap = {
            STU001: { ...mockUsers.student, password: 'Student@123' },
            WARDEN001: { ...mockUsers.warden, password: 'Warden@123' },
            SECURITY001: { ...mockUsers.security, password: 'Security@123' },
            ADMIN001: { ...mockUsers.admin, password: 'Admin@123' },
        };

        const user = userMap[body.id];

        if (!user || user.password !== body.password) {
            return HttpResponse.json(
                { detail: 'Invalid ID or password' },
                { status: 401 }
            );
        }

        return HttpResponse.json({
            access_token: 'mock-jwt-token',
            token_type: 'bearer',
            user_type: user.user_type,
            id: user.id,
        });
    }),

    http.get('/api/auth/me', ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (!auth) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
        return HttpResponse.json(mockUsers.student);
    }),

    // ── Student ─────────────────────────────────────────────
    http.get('/api/student/profile', () => {
        return HttpResponse.json(mockUsers.student);
    }),

    http.put('/api/student/profile', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ ...mockUsers.student, ...body });
    }),

    http.get('/api/student/gatepasses', () => {
        return HttpResponse.json([mockGatePass]);
    }),

    http.post('/api/student/gatepasses', async ({ request }) => {
        const body = await request.json();

        const outDt = new Date(`${body.out_date}T${body.out_time}`);
        const retDt = new Date(`${body.return_date}T${body.return_time}`);
        if (retDt <= outDt) {
            return HttpResponse.json(
                { detail: 'Return date/time must be after departure date/time' },
                { status: 400 }
            );
        }

        return HttpResponse.json({ ...mockGatePass, ...body, pass_id: 'new-pass-id' });
    }),

    http.get('/api/student/gatepasses/stats', () => {
        return HttpResponse.json({
            live: { total: 1, approved: 0, pending: 1, rejected: 0, currently_out: false },
            today: { requests_made: 1, approved: 0, rejected: 0, trips_completed: 0 },
            week: { requests_made: 1, approved: 0, rejected: 0, trips_completed: 0 },
            month: { requests_made: 1, approved: 0, rejected: 0, trips_completed: 0 },
            overall: { requests_made: 1, approved: 0, rejected: 0, trips_completed: 0 },
        });
    }),

    // ── Warden ──────────────────────────────────────────────
    http.get('/api/warden/gatepasses/pending', () => {
        return HttpResponse.json([mockGatePass]);
    }),

    http.get('/api/warden/gatepasses', () => {
        return HttpResponse.json([mockGatePass]);
    }),

    http.get('/api/warden/students', () => {
        return HttpResponse.json([mockUsers.student]);
    }),

    http.put('/api/warden/gatepasses/:passId/approve', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            ...mockGatePass, status: 'Approved', remarks: body.remarks
        });
    }),

    http.put('/api/warden/gatepasses/:passId/reject', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            ...mockGatePass, status: 'Rejected', remarks: body.remarks
        });
    }),

    http.get('/api/warden/gatepasses/stats', () => {
        return HttpResponse.json({
            live: { pending_requests: 1, total_approved: 0, currently_out: 0, total_students: 1 },
            today: { requests_received: 1, approved: 0, rejected: 0 },
            week: { requests_received: 1, approved: 0, rejected: 0 },
            month: { requests_received: 1, approved: 0, rejected: 0 },
            overall: { requests_received: 1, approved: 0, rejected: 0 },
        });
    }),

    // ── Security ────────────────────────────────────────────
    http.get('/api/security/gatepasses/actionable', () => {
        return HttpResponse.json([{ ...mockGatePass, status: 'Approved' }]);
    }),

    http.get('/api/security/gatepasses/out', () => {
        return HttpResponse.json([]);
    }),

    http.get('/api/security/gatepasses/history', () => {
        return HttpResponse.json([]);
    }),

    http.put('/api/security/gatepasses/:passId/exit', () => {
        return HttpResponse.json({ ...mockGatePass, status: 'Approved', exit_status: 'Out' });
    }),

    http.put('/api/security/gatepasses/:passId/return', () => {
        return HttpResponse.json({ ...mockGatePass, status: 'Approved', exit_status: 'In' });
    }),

    http.get('/api/security/gatepasses/stats', () => {
        return HttpResponse.json({
            live: { total_approved: 1, inside: 1, out: 0, overdue: 0 },
            today: { gate_passes: 1, exits: 0, returns: 0 },
            week: { gate_passes: 1, exits: 0, returns: 0 },
            month: { gate_passes: 1, exits: 0, returns: 0 },
            overall: { gate_passes: 1, exits: 0, returns: 0 },
        });
    }),

    // ── Admin ───────────────────────────────────────────────
    http.get('/api/admin/users', () => {
        return HttpResponse.json([mockUsers.student]);
    }),

    http.get('/api/admin/wardens', () => {
        return HttpResponse.json([mockUsers.warden]);
    }),

    http.get('/api/admin/security', () => {
        return HttpResponse.json([mockUsers.security]);
    }),

    http.get('/api/admin/admins', () => {
        return HttpResponse.json([mockUsers.admin]);
    }),

    http.post('/api/admin/users', async ({ request }) => {
        const body = await request.json();

        if (body.password && body.password.length < 8) {
            return HttpResponse.json(
                { detail: [{ msg: 'Password must be at least 8 characters' }] },
                { status: 422 }
            );
        }

        return HttpResponse.json({ ...body, is_active: true }, { status: 201 });
    }),

    http.get('/api/admin/users/:userId', ({ params }) => {
        return HttpResponse.json({ ...mockUsers.student, id: params.userId });
    }),

    http.put('/api/admin/users/:userId', async ({ request, params }) => {
        const body = await request.json();
        return HttpResponse.json({ ...mockUsers.student, id: params.userId, ...body });
    }),

    http.put('/api/admin/users/:userId/activate', ({ params }) => {
        return HttpResponse.json({ ...mockUsers.student, id: params.userId, is_active: true });
    }),

    http.put('/api/admin/users/:userId/deactivate', ({ params }) => {
        return HttpResponse.json({ ...mockUsers.student, id: params.userId, is_active: false });
    }),

    http.get('/api/admin/stats', () => {
        return HttpResponse.json({
            live: { active_students: 1, active_wardens: 1, active_security: 1, active_admins: 1, total_users: 4 },
            today: { new_students: 1, new_wardens: 0, new_security: 0, new_admins: 0 },
            week: { new_students: 1, new_wardens: 0, new_security: 0, new_admins: 0 },
            month: { new_students: 1, new_wardens: 0, new_security: 0, new_admins: 0 },
            overall: { new_students: 1, new_wardens: 1, new_security: 1, new_admins: 1 },
        });
    }),

    // ── Password reset ──────────────────────────────────────
    http.post('/api/auth/forgot-password', () => {
        return HttpResponse.json({
            message: 'If an account exists with that email, a reset link has been sent.'
        });
    }),

    http.post('/api/auth/reset-password', async ({ request }) => {
        const body = await request.json();
        if (body.token === 'invalid-token') {
            return HttpResponse.json(
                { detail: 'Invalid or expired reset link.' },
                { status: 400 }
            );
        }
        return HttpResponse.json({ message: 'Password reset successful. You can now log in.' });
    }),

    http.put('/api/auth/change-password', async ({ request }) => {
        const body = await request.json();
        if (body.current_password !== 'Student@123') {
            return HttpResponse.json(
                { detail: 'Current password is incorrect.' },
                { status: 400 }
            );
        }
        return HttpResponse.json({ message: 'Password changed successfully.' });
    }),
];