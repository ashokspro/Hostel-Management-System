// src/pages/admin/ManageStudents.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import UserDetailModal from '../../components/UserDetailModal';
import UserEditModal from '../../components/UserEditModal';
import usePageTitle from '../../hooks/usePageTitle';
import AdminResetPasswordModal from '../../components/AdminResetPasswordModal';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function ManageStudents() {
    usePageTitle('Manage Students');

    const [students, setStudents] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [year,     setYear]     = useState('');
    const [status,   setStatus]   = useState('');

    const [viewing, setViewing] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    const [resettingUser, setResettingUser] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load(filters = {}) {
        setLoading(true);
        try {
            const data = await adminApi.getStudents(filters);
            setStudents(data);
        } catch {
            toast.error('Failed to load students.');
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        load({ search, year, is_active: status });
    }

    function clearFilters() {
        setSearch(''); setYear(''); setStatus('');
        load();
    }

    async function toggleActive(student) {
        try {
            if (student.is_active) {
                await adminApi.deactivateUser(student.id);
                toast.success(`${student.name} deactivated.`);
            } else {
                await adminApi.activateUser(student.id);
                toast.success(`${student.name} activated.`);
            }
            load({ search, year, is_active: status });
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Action failed.');
        }
    }

    // ── View full details ────────────────────────────────
    async function openView(student) {
        setViewing({ id: student.id }); // open modal immediately with loading state
        setViewLoading(true);
        try {
            const data = await adminApi.getUser(student.id);
            setViewing(data);
        } catch {
            toast.error('Failed to load student details.');
            setViewing(null);
        } finally {
            setViewLoading(false);
        }
    }

    // ── Edit — fetch full record first ────────────────────
    async function openEdit(student) {
        try {
            const data = await adminApi.getUser(student.id);
            setEditing(data);
        } catch {
            toast.error('Failed to load student for editing.');
        }
    }

    async function saveEdit(formData) {
        setSaving(true);
        try {
            await adminApi.updateUser(editing.id, formData);
            toast.success('Student updated!');
            setEditing(null);
            load({ search, year, is_active: status });
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Update failed.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-gray-800">🎓 Manage Students</h1>

            {/* Filters */}
            <form onSubmit={handleSearch}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4
                          flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="🔍 Search by name, ID, or room..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] border-2 border-gray-200 rounded-lg
                              px-3 py-2 text-sm focus:border-blue-600 focus:outline-none
                              bg-gray-50"
                />
                <select value={year} onChange={(e) => setYear(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm
                              focus:border-blue-600 focus:outline-none bg-gray-50">
                    <option value="">All Years</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm
                              focus:border-blue-600 focus:outline-none bg-gray-50">
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
                <button type="submit"
                    className="bg-blue-800 text-white text-sm font-semibold px-4 py-2
                              rounded-lg hover:bg-blue-900 transition-colors">
                    Search
                </button>
                <button type="button" onClick={clearFilters}
                    className="text-xs text-gray-500 font-semibold hover:underline">
                    Clear
                </button>
            </form>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                {loading ? (
                    <LoadingSpinner />
                ) : students.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-3xl mb-2">🔍</p>
                        <p className="text-sm">No students found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase
                                           border-b border-gray-100">
                                <th className="px-5 py-3">ID</th>
                                <th className="px-3 py-3">Name</th>
                                <th className="px-3 py-3">Room</th>
                                <th className="px-3 py-3">Course</th>
                                <th className="px-3 py-3">Year</th>
                                <th className="px-3 py-3">Phone</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.id} className={`border-b border-gray-50
                                           hover:bg-gray-50 ${!s.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-5 py-3 font-mono text-xs">{s.id}</td>
                                    <td className="px-3 py-3 font-semibold text-gray-800">{s.name}</td>
                                    <td className="px-3 py-3">{s.room || '—'}</td>
                                    <td className="px-3 py-3">{s.course || '—'}</td>
                                    <td className="px-3 py-3">{s.year || '—'}</td>
                                    <td className="px-3 py-3">{s.phone || '—'}</td>
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

export default ManageStudents;