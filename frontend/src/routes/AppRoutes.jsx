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
import History from '../pages/security/History';

import AdminDashboard  from '../pages/admin/AdminDashboard';
import CreateUser      from '../pages/admin/CreateUser';
import ManageStudents  from '../pages/admin/ManageStudents';
import ManageWardens   from '../pages/admin/ManageWardens';
import ManageSecurity  from '../pages/admin/ManageSecurity';

import ManageAdmins from '../pages/admin/ManageAdmins';

import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword   from '../pages/ResetPassword';
import ChangePassword  from '../pages/ChangePassword';

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
    <Route path="history"   element={<History />} />
</Route>



            <Route
    path="/admin"
    element={
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
        </ProtectedRoute>
    }
>
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="create"    element={<CreateUser />} />
    <Route path="students"  element={<ManageStudents />} />
    <Route path="wardens"   element={<ManageWardens />} />
    <Route path="security"  element={<ManageSecurity />} />
    <Route path="admins" element={<ManageAdmins />} />
</Route>


            {/* ── Catch-all ────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />



// Add to public routes section:
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password"  element={<ResetPassword />} />

// Add a role-agnostic protected route — works for ANY logged-in user
// Sidebar still renders correctly because it reads userType() from context,
// not from the URL path
<Route
    path="/account"
    element={
        <ProtectedRoute>
            <DashboardLayout />
        </ProtectedRoute>
    }
>
    <Route path="change-password" element={<ChangePassword />} />
</Route>

        </Routes>

    


    );
}

export default AppRoutes;