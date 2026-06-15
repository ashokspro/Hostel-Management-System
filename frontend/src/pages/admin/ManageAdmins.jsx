// src/pages/admin/ManageAdmins.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import UserDetailModal from '../../components/UserDetailModal';
import UserEditModal from '../../components/UserEditModal';
import usePageTitle from '../../hooks/usePageTitle';
import AdminResetPasswordModal from '../../components/AdminResetPasswordModal';

function ManageAdmins() {
    usePageTitle('Manage Admins');

    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    const [viewing, setViewing] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const [resettingUser, setResettingUser] = useState(null)
    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await adminApi.getAdmins();
            setStaff(data);
        } catch {
            toast.error('Failed to load Admins.');
        } finally {
            setLoading(false);
        }
    }

    async function toggleActive(s) {
        try {
            if (s.is_active) {
                await adminApi.deactivateUser(s.id);
                toast.success(`${s.name} deactivated.`);
            } else {
                await adminApi.activateUser(s.id);
                toast.success(`${s.name} activated.`);
            }
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Action failed.');
        }
    }

    async function openView(s) {
        setViewing({ id: s.id });
        setViewLoading(true);
        try {
            const data = await adminApi.getUser(s.id);
            setViewing(data);
        } catch {
            toast.error('Failed to load details.');
            setViewing(null);
        } finally {
            setViewLoading(false);
        }
    }

    async function openEdit(s) {
        try {
            const data = await adminApi.getUser(s.id);
            setEditing(data);
        } catch {
            toast.error('Failed to load staff for editing.');
        }
    }

    async function saveEdit(formData) {
        setSaving(true);
        try {
            await adminApi.updateUser(editing.id, formData);
            toast.success('Admins updated!');
            setEditing(null);
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Update failed.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <LoadingSpinner text="Loading Admins..." />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">⚙️  Admins</h1>
                <button onClick={load}
                    className="text-xs text-blue-700 font-semibold hover:underline">
                    🔄 Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                {staff.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-3xl mb-2">⚙️ </p>
                        <p className="text-sm">No Admins found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase
                                           border-b border-gray-100">
                                <th className="px-5 py-3">ID</th>
                                <th className="px-3 py-3">Name</th>
                                <th className="px-3 py-3">Email</th>
                                <th className="px-3 py-3">Phone</th>
                                <th className="px-3 py-3">Role</th>
                                <th className="px-3 py-3">Emergency Contact</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(s => (
                                <tr key={s.id} className={`border-b border-gray-50
                                           hover:bg-gray-50 ${!s.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-5 py-3 font-mono text-xs">{s.id}</td>
                                    <td className="px-3 py-3 font-semibold text-gray-800">{s.name}</td>
                                    <td className="px-3 py-3">{s.email || '—'}</td>
                                    <td className="px-3 py-3">{s.phone || '—'}</td>
                                    <td className="px-3 py-3">{s.role || '—'}</td>
                                    <td className="px-3 py-3">{s.emergency_contact || '—'}</td>
                                    <td className="px-3 py-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1
                                                         rounded-full
                                                         ${s.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-500'}`}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => openView(s)}
                                                className="text-gray-600 hover:text-gray-900 text-xs font-semibold">
                                                👁️ View
                                            </button>
                                            <button onClick={() => openEdit(s)}
                                                className="text-blue-700 hover:text-blue-900 text-xs font-semibold">
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => toggleActive(s)}
                                                className={`text-xs font-semibold
                                                          ${s.is_active
                                                              ? 'text-red-600 hover:text-red-800'
                                                              : 'text-green-600 hover:text-green-800'}`}
                                            >
                                                {s.is_active ? '🚫 Deactivate' : '✅ Activate'}
                                            </button>
                                            <button onClick={() => setResettingUser(s)}
    className="text-orange-600 hover:text-orange-800 text-xs font-semibold">
    🔑 Reset
</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {viewing && (
                <UserDetailModal user={viewing} loading={viewLoading} onClose={() => setViewing(null)} />
            )}
            {editing && (
                <UserEditModal user={editing} saving={saving} onSave={saveEdit} onClose={() => setEditing(null)} />
            )}

            {resettingUser && (
    <AdminResetPasswordModal user={resettingUser} onClose={() => setResettingUser(null)} />
)}
        </div>
    );
}

export default ManageAdmins;