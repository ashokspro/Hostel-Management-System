// src/pages/Unauthorized.jsx

import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Unauthorized() {
    const navigate  = useNavigate();
    const { logout, userType } = useAuth();

    // Redirect to their correct dashboard
    const goToDashboard = () => {
        const dashboards = {
            student:  '/student/dashboard',
            warden:   '/warden/dashboard',
            security: '/security/dashboard',
            admin:    '/admin/dashboard',
        };
        navigate(dashboards[userType()] || '/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center
                        bg-gradient-to-br from-blue-900 to-blue-500">
            <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Access Denied
                </h1>
                <p className="text-gray-500 mb-2">
                    You don't have permission to view this page.
                </p>
                <p className="text-sm text-gray-400 mb-8">
                    Logged in as: <span className="font-semibold capitalize">
                        {userType() || 'Unknown'}
                    </span>
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={goToDashboard}
                        className="bg-blue-800 text-white px-5 py-2.5 rounded-lg
                                   font-semibold hover:bg-blue-900 transition-colors"
                    >
                        My Dashboard
                    </button>
                    <button
                        onClick={logout}
                        className="border-2 border-red-500 text-red-500 px-5 py-2.5
                                   rounded-lg font-semibold hover:bg-red-500
                                   hover:text-white transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Unauthorized;