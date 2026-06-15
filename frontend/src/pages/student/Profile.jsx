// src/pages/student/Profile.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import studentApi from '../../api/studentApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import usePageTitle from '../../hooks/usePageTitle';

// Fields the student is allowed to edit themselves
const editableFields = ['phone', 'email', 'guardian_name', 'guardian_phone'];

function Profile() {
    usePageTitle('My Profile');

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({});

    // ── Fetch profile on mount ───────────────────────────
    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        setLoading(true);
        try {
            const data = await studentApi.getProfile();
            setProfile(data);
            // Pre-fill the form with current values
            setForm({
                phone: data.phone || '',
                email: data.email || '',
                guardian_name: data.guardian_name || '',
                guardian_phone: data.guardian_phone || '',
            });
        } catch {
            toast.error('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await studentApi.updateProfile(form);
            setProfile(updated);
            setEditMode(false);
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Update failed.');
        } finally {
            setSaving(false);
        }
    }

    function cancelEdit() {
        // Reset form back to current profile values
        setForm({
            phone: profile.phone || '',
            email: profile.email || '',
            guardian_name: profile.guardian_name || '',
            guardian_phone: profile.guardian_phone || '',
        });
        setEditMode(false);
    }

    if (loading) return <LoadingSpinner text="Loading profile..." />;
    if (!profile) return <p className="text-gray-500">Could not load profile.</p>;

    return (
        <div className="max-w-2xl">

            {/* ── Profile header card ─────────────────────── */}
            <div className="bg-gradient-to-br from-blue-800 to-blue-500 rounded-xl
                            shadow-sm p-6 mb-5 text-white flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur
                                flex items-center justify-center text-2xl font-bold
                                border-2 border-white/30 flex-shrink-0">
                    {profile.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                    <h1 className="text-lg font-bold truncate">{profile.name}</h1>
                    <p className="text-blue-100 text-sm mt-0.5">
                        {profile.id} · Room {profile.room || '—'}
                    </p>
                    <p className="text-blue-200 text-xs mt-0.5">
                        {profile.course || '—'} · {profile.year || '—'}
                    </p>
                </div>
            </div>

            {/* ── Section header + edit button ────────────── */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700">Contact Information</h2>
                {!editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="bg-blue-800 text-white text-sm font-semibold
                                  px-4 py-2 rounded-lg hover:bg-blue-900
                                  transition-colors flex items-center gap-2"
                    >
                        ✏️ Edit
                    </button>
                )}
            </div>

            {/* ── Contact info card ───────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

                {editMode ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold
                                                  text-gray-500 uppercase mb-1">Phone</label>
                                <input
                                    name="phone" value={form.phone} onChange={handleChange}
                                    pattern="[0-9]{10}" maxLength={10}
                                    title="Phone must be exactly 10 digits"
                                    className="w-full border-2 border-gray-200 rounded-lg
                                              px-3 py-2 text-sm focus:border-blue-600
                                              focus:outline-none bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold
                                                  text-gray-500 uppercase mb-1">Email</label>
                                <input
                                    name="email" type="email" value={form.email} onChange={handleChange}
                                    className="w-full border-2 border-gray-200 rounded-lg
                                              px-3 py-2 text-sm focus:border-blue-600
                                              focus:outline-none bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold
                                                  text-gray-500 uppercase mb-1">Guardian Name</label>
                                <input
                                    name="guardian_name" value={form.guardian_name} onChange={handleChange}
                                    className="w-full border-2 border-gray-200 rounded-lg
                                              px-3 py-2 text-sm focus:border-blue-600
                                              focus:outline-none bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold
                                                  text-gray-500 uppercase mb-1">Guardian Phone</label>
                                <input
                                    name="guardian_phone" value={form.guardian_phone} onChange={handleChange}
                                    pattern="[0-9]{10}" maxLength={10}
                                    title="Phone must be exactly 10 digits"
                                    className="w-full border-2 border-gray-200 rounded-lg
                                              px-3 py-2 text-sm focus:border-blue-600
                                              focus:outline-none bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit" disabled={saving}
                                className="bg-blue-800 text-white text-sm font-semibold
                                          px-5 py-2 rounded-lg hover:bg-blue-900
                                          disabled:opacity-60 transition-colors"
                            >
                                {saving ? 'Saving...' : '💾 Save Changes'}
                            </button>
                            <button
                                type="button" onClick={cancelEdit}
                                className="border-2 border-gray-200 text-gray-600
                                          text-sm font-semibold px-5 py-2 rounded-lg
                                          hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400
                                          uppercase tracking-wide mb-1">Phone</p>
                            <p className="text-sm font-medium text-gray-800">{profile.phone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400
                                          uppercase tracking-wide mb-1">Email</p>
                            <p className="text-sm font-medium text-gray-800">{profile.email || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400
                                          uppercase tracking-wide mb-1">Guardian Name</p>
                            <p className="text-sm font-medium text-gray-800">{profile.guardian_name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400
                                          uppercase tracking-wide mb-1">Guardian Phone</p>
                            <p className="text-sm font-medium text-gray-800">{profile.guardian_phone || '—'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;