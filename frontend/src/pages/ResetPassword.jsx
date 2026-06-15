// src/pages/ResetPassword.jsx

import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authApi from '../api/authApi';
import { extractErrorMessage } from '../utils/errorHelper';
import usePageTitle from '../hooks/usePageTitle';

function ResetPassword() {
    usePageTitle('Reset Password');

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg('');

        if (!token) {
            setErrorMsg('Invalid or missing reset link. Please request a new one.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await authApi.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login', { replace: true }), 2500);
        } catch (err) {
            setErrorMsg(extractErrorMessage(err, 'Failed to reset password.'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center
                        bg-gradient-to-br from-blue-900 to-blue-500 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">

                    <div className="bg-gradient-to-br from-blue-800 to-blue-500
                                    text-white px-8 py-10 text-center">
                        <div className="w-16 h-16 bg-white/15 backdrop-blur rounded-2xl
                                        flex items-center justify-center text-3xl
                                        mx-auto mb-4 border border-white/20">
                            🔒
                        </div>
                        <h1 className="text-xl font-bold">Reset Password</h1>
                        <p className="text-blue-100 text-sm mt-1">
                            Choose a new password
                        </p>
                    </div>

                    <div className="p-8">
                        {!token && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700
                                          text-sm px-4 py-3 rounded-lg mb-4">
                                This reset link is invalid or missing a token.{' '}
                                <Link to="/forgot-password" className="font-semibold underline">
                                    Request a new one
                                </Link>.
                            </div>
                        )}

                        {success ? (
                            <div className="bg-green-50 border-l-4 border-green-500
                                          text-green-700 text-sm px-4 py-3 rounded-lg">
                                Password reset successful! Redirecting to login...
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {errorMsg && (
                                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700
                                                  text-sm px-4 py-3 rounded-lg">
                                        {errorMsg}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold uppercase
                                                      tracking-wide text-gray-600 mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 8 chars, mixed case, number, symbol"
                                            className="w-full border-2 border-gray-200 rounded-lg
                                                      px-4 py-2.5 pr-11 text-sm focus:border-blue-600
                                                      focus:outline-none focus:ring-2
                                                      focus:ring-blue-100 transition-all bg-gray-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2
                                                      text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
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

                                <div>
                                    <label className="block text-xs font-semibold uppercase
                                                      tracking-wide text-gray-600 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                        className="w-full border-2 border-gray-200 rounded-lg
                                                  px-4 py-2.5 text-sm focus:border-blue-600
                                                  focus:outline-none focus:ring-2
                                                  focus:ring-blue-100 transition-all bg-gray-50"
                                    />
                                </div>

                                <button
                                    type="submit" disabled={loading || !token}
                                    className="w-full bg-gradient-to-r from-blue-800 to-blue-500
                                              text-white font-semibold py-3 rounded-lg
                                              hover:shadow-lg hover:shadow-blue-500/40
                                              transition-all disabled:opacity-60
                                              flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white
                                                            border-t-transparent rounded-full
                                                            animate-spin" />
                                            Resetting...
                                        </>
                                    ) : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;