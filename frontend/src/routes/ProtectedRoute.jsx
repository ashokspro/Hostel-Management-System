// src/routes/ProtectedRoute.jsx

import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// allowedRoles — array of roles that can access this route
// Example: allowedRoles={['warden', 'admin']}
// If empty/undefined — any logged-in user can access

function ProtectedRoute({ children, allowedRoles }) {
    const { isLoggedIn, userType, loading } = useAuth();
    
    // useLocation gives us the current URL
    // We save it so after login we can redirect back to where they were
    const location = useLocation();

    // ── Still checking localStorage / fetching user ───────
    // Show nothing while we restore the session
    // Without this, the app flashes the login page on every refresh
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center
                            bg-gradient-to-br from-blue-900 to-blue-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-white 
                                    border-t-transparent rounded-full animate-spin"/>
                    <p className="text-white font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // ── Not logged in → send to login ─────────────────────
    // state={{ from: location }} saves where they tried to go
    // After login, we can redirect them back
    if (!isLoggedIn()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // ── Wrong role → send to unauthorized ─────────────────
    // allowedRoles=['student'] but user is 'warden' → blocked
    if (allowedRoles && allowedRoles.length > 0) {
        const currentRole = userType();
        if (!allowedRoles.includes(currentRole)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // ── All checks passed → render the page ───────────────
    return children;
}

export default ProtectedRoute;