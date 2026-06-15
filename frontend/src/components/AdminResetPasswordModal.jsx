// src/components/AdminResetPasswordModal.jsx

import { useState } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../api/adminApi';
import { extractErrorMessage } from '../utils/errorHelper';

function AdminResetPasswordModal({ user, onClose }) {
    const [mode, setMode] = useState('generate'); // 'generate' | 'custom'
    const [customPassword, setCustomPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { message, temporary_password? }

    if (!user) return null;

    async function handleSubmit() {
        setLoading(true);
        try {
            const data = await adminApi.resetUserPassword(
                user.id,
                mode === 'custom' ? customPassword : null
            );
            setResult(data);
            toast.success('Password reset successfully!');
        } catch (err) {
            toast.error(extractErrorMessage(err, 'Failed to reset password.'));
        } finally {
            setLoading(false);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    }

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                        justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full
                            animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex
                                items-center justify-between">
                    <h3 className="text-base font-bold text-gray-800">
                        🔑 Reset Password — {user.name}
                    </h3>
                    <button onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                </div>

                <div className="p-5">
                    {result ? (
                        <div className="space-y-3">
                            <div className="bg-green-50 border-l-4 border-green-500
                                          text-green-700 text-sm px-4 py-3 rounded-lg">
                                {result.message}
                            </div>
                            {result.temporary_password && (
                                <div className="bg-gray-50 border-2 border-gray-200
                                              rounded-lg p-4">
                                    <p className="text-xs font-semibold text-gray-500
                                                  uppercase mb-2">
                                        Temporary Password — share securely
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-white border border-gray-200
                                                        rounded-lg px-3 py-2 text-sm font-mono
                                                        text-gray-800">
                                            {result.temporary_password}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(result.temporary_password)}
                                            className="bg-blue-800 text-white text-xs font-semibold
                                                      px-3 py-2 rounded-lg hover:bg-blue-900
                                                      transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        The user should change this password after logging in.
                                    </p>
                                </div>
                            )}
                            <button onClick={onClose}
                                className="w-full border-2 border-gray-200 text-gray-600
                                          text-sm font-semibold py-2 rounded-lg
                                          hover:bg-gray-50 transition-colors">
                                Close
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setMode('generate')}
                                    className={`flex-1 text-sm font-semibold py-2.5 rounded-lg
                                              border-2 transition-colors
                                              ${mode === 'generate'
                                                  ? 'bg-blue-800 text-white border-blue-800'
                                                  : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                >
                                    Generate Random
                                </button>
                                <button
                                    onClick={() => setMode('custom')}
                                    className={`flex-1 text-sm font-semibold py-2.5 rounded-lg
                                              border-2 transition-colors
                                              ${mode === 'custom'
                                                  ? 'bg-blue-800 text-white border-blue-800'
                                                  : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                >
                                    Set Custom
                                </button>
                            </div>

                            {mode === 'custom' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500
                                                      uppercase mb-1.5">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={customPassword}
                                            onChange={(e) => setCustomPassword(e.target.value)}
                                            placeholder="Min 8 chars, mixed case, number, symbol"
                                            className="w-full border-2 border-gray-200 rounded-lg
                                                      px-3 py-2 pr-10 text-sm focus:border-blue-600
                                                      focus:outline-none bg-gray-50"
                                        />
                                        <button type="button" onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2
                                                      text-gray-400 hover:text-gray-600" tabIndex={-1}>
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-yellow-50 border-l-4 border-yellow-400
                                          text-yellow-800 text-xs px-4 py-3 rounded-lg">
                                {mode === 'generate'
                                    ? 'A random temporary password will be generated. You\'ll need to share it with the user manually.'
                                    : 'The user\'s password will be set to the value you enter.'}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || (mode === 'custom' && !customPassword)}
                                    className="flex-1 bg-red-600 text-white text-sm font-semibold
                                              py-2.5 rounded-lg hover:bg-red-700
                                              disabled:opacity-60 transition-colors"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                                <button onClick={onClose}
                                    className="border-2 border-gray-200 text-gray-600 text-sm
                                              font-semibold px-5 py-2.5 rounded-lg
                                              hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminResetPasswordModal;