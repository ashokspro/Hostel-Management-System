// src/pages/student/Profile.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import studentApi from '../../api/studentApi';
import LoadingSpinner from '../../components/LoadingSpinner';

// Fields the student is allowed to edit themselves
const editableFields = ['phone', 'email', 'guardian_name', 'guardian_phone'];

function Profile() {
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

    // Read-only fields — shown but never editable here
    const readonlyFields = [
        { label: 'Student ID', value: profile.id },
        { label: 'Name',       value: profile.name },
        { label: 'Room',       value: profile.room || '—' },
        { label: 'Course',     value: profile.course || '—' },
        { label: 'Year',       value: profile.year || '—' },
    ];

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

                {/* ── Read-only info ─────────────────────── */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                    {readonlyFields.map(f => (
                        <div key={f.label}>
                            <p className="text-xs font-semibold text-gray-400
                                          uppercase tracking-wide mb-1">{f.label}</p>
                            <p className="text-sm font-medium text-gray-800">{f.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Editable fields ────────────────────── */}
                {editMode ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold
                                                  text-gray-500 uppercase mb-1">Phone</label>
                                <input
                                    name="phone" value={form.phone} onChange={handleChange}
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