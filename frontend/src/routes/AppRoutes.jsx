// src/routes/AppRoutes.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

import ProtectedRoute   from './ProtectedRoute';
import DashboardLayout  from '../layouts/DashboardLayout';
import Login            from '../pages/Login';
import NotFound         from '../pages/NotFound';
import Unauthorized     from '../pages/Unauthorized';

// Student pages
import StudentDashboard from '../pages/student/StudentDashboard';
import Profile          from '../pages/student/Profile';
import GatePasses       from '../pages/student/GatePasses';

import WardenDashboard  from '../pages/warden/WardenDashboard';
import PendingRequests  from '../pages/warden/PendingRequests';
import AllGatePasses    from '../pages/warden/AllGatePasses';
import Students         from '../pages/warden/Students';

// Update imports — replace placeholder
import SecurityDashboard from '../pages/security/SecurityDashboard';
import ApprovedPasses    from '../pages/security/ApprovedPasses';
import CurrentlyOut      from '../pages/security/CurrentlyOut';


function RoleRedirect() {
    const { isLoggedIn, userType } = useAuth();
    if (!isLoggedIn()) return <Navigate to="/login" replace />;

    const dashboards = {
        student:  '/student/dashboard',
        warden:   '/warden/dashboard',
        security: '/security/dashboard',
        admin:    '/admin/dashboard',
    };
    return <Navigate to={dashboards[userType()] || '/login'} replace />;
}


function LoginRoute() {
    const { isLoggedIn, userType } = useAuth();
    if (isLoggedIn()) {
        const dashboards = {
            student:  '/student/dashboard',
            warden:   '/warden/dashboard',
            security: '/security/dashboard',
            admin:    '/admin/dashboard',
        };
        return <Navigate to={dashboards[userType()] || '/'} replace />;
    }
    return <Login />;
}


function AppRoutes() {
    return (
        <Routes>

            {/* ── Public routes ──────────────────────────── */}
            <Route path="/"             element={<RoleRedirect />} />
            <Route path="/login"        element={<LoginRoute />} />
            <Route path="/unauthorized" element={<Unauthorized />} />


            {/* ── Student section ─────────────────────────── */}
            <Route
                path="/student"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="dashboard"  element={<StudentDashboard />} />
                <Route path="profile"    element={<Profile />} />
                <Route path="gatepasses" element={<GatePasses />} />
            </Route>


            {/* ── Warden section ──────────────────────────── */}
            // Replace warden section:
<Route
    path="/warden"
    element={
        <ProtectedRoute allowedRoles={['warden']}>
            <DashboardLayout />
        </ProtectedRoute>
    }
>
    <Route path="dashboard"  element={<WardenDashboard />} />
    <Route path="pending"    element={<PendingRequests />} />
    <Route path="gatepasses" element={<AllGatePasses />} />
    <Route path="students"   element={<Students />} />
</Route>


            {/* ── Security section ────────────────────────── */}
            // Replace security section:
<Route
    path="/security"
    element={
        <ProtectedRoute allowedRoles={['security']}>
            <DashboardLayout />
        </ProtectedRoute>
    }
>
    <Route path="dashboard" element={<SecurityDashboard />} />
    <Route path="approved"  element={<ApprovedPasses />} />
    <Route path="out"       element={<CurrentlyOut />} />
</Route>



            {/* ── Admin section ──────────────────────────────
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="dashboard" element={<AdminDashboard />} />
            </Route> */}


            {/* ── Catch-all ────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />

        </Routes>
    );
}

export default AppRoutes;