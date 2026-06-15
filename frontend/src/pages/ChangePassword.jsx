// src/pages/ChangePassword.jsx

import { useState } from 'react';
import { toast } from 'react-toastify';
import authApi from '../api/authApi';
import { extractErrorMessage } from '../utils/errorHelper';
import usePageTitle from '../hooks/usePageTitle';

function ChangePassword() {
    usePageTitle('Change Password');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }

        if (currentPassword === newPassword) {
            toast.error('New password must be different from current password.');
            return;
        }

        setSaving(true);
        try {
            await authApi.changePassword(currentPassword, newPassword);
            toast.success('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.error(extractErrorMessage(err, 'Failed to change password.'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-md">
            <h1 className="text-xl font-bold text-gray-800 mb-1">🔑 Change Password</h1>
            <p className="text-sm text-gray-500 mb-5">
                Update your account password. You'll need your current password.
            </p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-xs font-semibold text-gray-500
                                          uppercase mb-1.5">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                required value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-lg
                                          px-3 py-2 pr-10 text-sm focus:border-blue-600
                                          focus:outline-none bg-gray-50"
                            />
                            <button type="button" onClick={() => setShowCurrent(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2
                                          text-gray-400 hover:text-gray-600" tabIndex={-1}>
                                {showCurrent ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5"
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
                        <label className="block text-xs font-semibold text-gray-500
                                          uppercase mb-1.5">New Password</label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                required value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 8 chars, mixed case, number, symbol"
                                className="w-full border-2 border-gray-200 rounded-lg
                                          px-3 py-2 pr-10 text-sm focus:border-blue-600
                                          focus:outline-none bg-gray-50"
                            />
                            <button type="button" onClick={() => setShowNew(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2
                                          text-gray-400 hover:text-gray-600" tabIndex={-1}>
                                {showNew ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5"
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
                        <label className="block text-xs font-semibold text-gray-500
                                          uppercase mb-1.5">Confirm New Password</label>
                        <input
                            type={showNew ? 'text' : 'password'}
                            required value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-lg
                                      px-3 py-2 text-sm focus:border-blue-600
                                      focus:outline-none bg-gray-50"
                        />
                    </div>

                    <button
                        type="submit" disabled={saving}
                        className="bg-blue-800 text-white text-sm font-semibold
                                  px-5 py-2.5 rounded-lg hover:bg-blue-900
                                  disabled:opacity-60 transition-colors"
                    >
                        {saving ? 'Updating...' : '💾 Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;