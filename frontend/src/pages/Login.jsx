// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

import useAuth  from '../hooks/useAuth';
import authApi  from '../api/authApi';
import usePageTitle from '../hooks/usePageTitle';


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

    const [userType, setUserType] = useState('student');
    const [id,       setId]       = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    usePageTitle('Login');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!id.trim() || !password) {
            setErrorMsg('Please fill in all fields.');
            return;
        }

        setLoading(true);

        try {
            const data = await authApi.login(id.trim(), password);

            if (data.user_type !== userType) {
                toast.warning(
                    `This account is registered as "${data.user_type}", ` +
                    `not "${userType}". Redirecting to the correct dashboard.`
                );
            }

            const realRole = await login(data);
            toast.success('Login successful!');

            const redirectTo = location.state?.from?.pathname;
            const target = redirectTo && redirectTo !== '/login'
                ? redirectTo
                : dashboardPaths[realRole] || '/';

            navigate(target, { replace: true });

        } catch (err) {
            // Handle different error response shapes
            let message = 'Login failed. Please try again.';

            if (err.response) {
                const detail = err.response.data?.detail;
                if (typeof detail === 'string') {
                    message = detail;
                } else if (err.response.status === 401) {
                    message = 'Invalid ID or password. Please try again.';
                } else if (err.response.status === 422) {
                    message = 'Please check your input and try again.';
                }
            } else if (err.request) {
                message = 'Cannot connect to server. Make sure the backend is running.';
            }

            setErrorMsg(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center
                        bg-gradient-to-br from-blue-900 to-blue-500 p-4">

            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden
                                animate-fadeInUp">

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

                        {/* Error banner */}
                        {errorMsg && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700
                                          text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                                <span className="text-red-500 font-bold">!</span>
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* User type */}
                        <div>
                            <label className="block text-xs font-semibold uppercase
                                              tracking-wide text-gray-600 mb-1.5">
                                User Type
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
                                User ID
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
                                Password
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
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2
                                              text-gray-400 hover:text-gray-600
                                              transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        // Eye-off icon (SVG)
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        // Eye icon (SVG)
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="text-right -mt-2">
    <Link to="/forgot-password"
        className="text-xs text-blue-700 font-semibold hover:underline">
        Forgot Password?
    </Link>
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
                                'Login'
                            )}
                        </button>
                    </form>
                </div>           
                <p className="text-center text-blue-100 text-sm mt-4">
                     Secure & Reliable Hostel Management
                </p>
            </div>
        </div>
    );
}

export default Login;