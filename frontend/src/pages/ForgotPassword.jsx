// src/pages/ForgotPassword.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import authApi from '../api/authApi';
import { extractErrorMessage } from '../utils/errorHelper';
import usePageTitle from '../hooks/usePageTitle';

function ForgotPassword() {
    usePageTitle('Forgot Password');

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        try {
            await authApi.forgotPassword(email.trim());
            setSubmitted(true);
        } catch (err) {
            setErrorMsg(extractErrorMessage(err, 'Failed to send reset link.'));
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
                            🔑
                        </div>
                        <h1 className="text-xl font-bold">Forgot Password?</h1>
                        <p className="text-blue-100 text-sm mt-1">
                            We'll email you a reset link
                        </p>
                    </div>

                    <div className="p-8">
                        {submitted ? (
                            <div className="text-center space-y-4">
                                <div className="bg-green-50 border-l-4 border-green-500
                                              text-green-700 text-sm px-4 py-3 rounded-lg
                                              text-left">
                                    If an account exists with that email, a reset link
                                    has been sent. Check your inbox (and spam folder).
                                </div>
                                <Link to="/login"
                                    className="text-blue-700 text-sm font-semibold hover:underline">
                                    ← Back to Login
                                </Link>
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
                                        Email Address
                                    </label>
                                    <input
                                        type="email" required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full border-2 border-gray-200 rounded-lg
                                                  px-4 py-2.5 text-sm focus:border-blue-600
                                                  focus:outline-none focus:ring-2
                                                  focus:ring-blue-100 transition-all bg-gray-50"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Enter the email associated with your account.
                                    </p>
                                </div>

                                <button
                                    type="submit" disabled={loading}
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
                                            Sending...
                                        </>
                                    ) : 'Send Reset Link'}
                                </button>

                                <p className="text-center">
                                    <Link to="/login"
                                        className="text-blue-700 text-sm font-semibold hover:underline">
                                        ← Back to Login
                                    </Link>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;