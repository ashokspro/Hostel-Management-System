// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

import useAuth  from '../hooks/useAuth';
import authApi  from '../api/authApi';

// Maps backend user_type → dashboard route
const dashboardPaths = {
    student:  '/student/dashboard',
    warden:   '/warden/dashboard',
    security: '/security/dashboard',
    admin:    '/admin/dashboard',
};

function Login() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { login } = useAuth();

    // ── Form state ─────────────────────────────────────────
    const [userType, setUserType] = useState('student');
    const [id,       setId]       = useState('');
    const [password, setPassword] = useState('');
    // Add this state near the top with other useState calls
    const [showPassword, setShowPassword] = useState(false);
    const [loading,  setLoading]  = useState(false);


    // ── Submit handler ─────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!id.trim() || !password) {
            toast.error('Please fill in all fields.');
            return;
        }

        setLoading(true);

        try {
            // Call POST /api/auth/login
            // Response: { access_token, token_type, user_type, id }
            const data = await authApi.login(id.trim(), password);

            // ── Sanity check ────────────────────────────────
            // Backend doesn't validate "user type" at login —
            // it just returns whoever owns that ID.
            // If the dropdown doesn't match, warn but still log in
            // using the REAL role from the backend.
            if (data.user_type !== userType) {
                toast.warning(
                    `This account is registered as "${data.user_type}", ` +
                    `not "${userType}". Redirecting to the correct dashboard.`
                );
            }

            // login() saves token to localStorage AND fetches full profile
            const realRole = await login(data);

            toast.success('Login successful!');

            // ── Redirect ─────────────────────────────────────
            // If user was redirected here from a protected route
            // (ProtectedRoute saved location.state.from), send them back there
            // Otherwise go to their role's dashboard
            const redirectTo = location.state?.from?.pathname;
            const target = redirectTo && redirectTo !== '/login'
                ? redirectTo
                : dashboardPaths[realRole] || '/';

            navigate(target, { replace: true });

        } catch (err) {
            // FastAPI returns { detail: "Invalid credentials" } on 401
            const message = err.response?.data?.detail || 'Login failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center
                        bg-gradient-to-br from-blue-900 to-blue-500 p-4">

            <div className="w-full max-w-md">

                {/* ── Card ──────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden
                                animate-[fadeInUp_0.4s_ease-out]">

                    {/* Header */}
                    <div className="bg-gradient-to-br from-blue-800 to-blue-500
                                    text-white px-8 py-10 text-center">
                        <div className="w-16 h-16 bg-white/15 backdrop-blur rounded-2xl
                                        flex items-center justify-center text-3xl
                                        mx-auto mb-4 border border-white/20">
                            🛡️
                        </div>
                        <h1 className="text-xl font-bold">Smart Hostel Management</h1>
                        <p className="text-blue-100 text-sm mt-1">Gate Pass System</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-5">

                        {/* User type */}
                        <div>
                            <label className="block text-xs font-semibold uppercase
                                              tracking-wide text-gray-600 mb-1.5">
                                👥 User Type
                            </label>
                            <select
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-lg
                                          px-4 py-2.5 text-sm focus:border-blue-600
                                          focus:outline-none focus:ring-2
                                          focus:ring-blue-100 transition-all bg-gray-50"
                            >
                                <option value="student">Student</option>
                                <option value="warden">Warden</option>
                                <option value="security">Security</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* User ID */}
                        <div>
                            <label className="block text-xs font-semibold uppercase
                                              tracking-wide text-gray-600 mb-1.5">
                                🆔 User ID
                            </label>
                            <input
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                placeholder="Enter your ID"
                                autoComplete="username"
                                className="w-full border-2 border-gray-200 rounded-lg
                                          px-4 py-2.5 text-sm focus:border-blue-600
                                          focus:outline-none focus:ring-2
                                          focus:ring-blue-100 transition-all bg-gray-50"
                            />
                        </div>

                        {/* Password */}
<div>
    <label className="block text-xs font-semibold uppercase
                      tracking-wide text-gray-600 mb-1.5">
        🔑 Password
    </label>
    <div className="relative">
        <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="w-full border-2 border-gray-200 rounded-lg
                      px-4 py-2.5 pr-11 text-sm focus:border-blue-600
                      focus:outline-none focus:ring-2
                      focus:ring-blue-100 transition-all bg-gray-50"
        />
        <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2
                      text-gray-400 hover:text-gray-600 text-sm
                      transition-colors"
            tabIndex={-1}
        >
            {showPassword ? '🙈' : '👁️'}
        </button>
    </div>
</div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-800 to-blue-500
                                      text-white font-semibold py-3 rounded-lg
                                      hover:shadow-lg hover:shadow-blue-500/40
                                      hover:-translate-y-0.5 transition-all
                                      disabled:opacity-60 disabled:cursor-not-allowed
                                      disabled:translate-y-0 flex items-center
                                      justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white
                                                    border-t-transparent rounded-full
                                                    animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>🔓 Login</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-100 text-sm mt-4">
                    🛡️ Secure & Reliable Hostel Management
                </p>
            </div>
        </div>
    );
}

export default Login;