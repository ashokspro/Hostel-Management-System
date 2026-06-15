// src/pages/admin/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';

function AdminDashboard() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [wardens,  setWardens]  = useState([]);
    const [security, setSecurity] = useState([]);
    const [loading,  setLoading]  = useState(true);
    usePageTitle('Admin Dashboard');
    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [studentsData, wardensData, securityData] = await Promise.all([
                adminApi.getStudents(),
                adminApi.getWardens(),
                adminApi.getSecurity(),
            ]);
            setStudents(studentsData);
            setWardens(wardensData);
            setSecurity(securityData);
        } catch {
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LoadingSpinner text="Loading dashboard..." />;

    const activeStudents = students.filter(s => s.is_active).length;
    const activeWardens  = wardens.filter(w => w.is_active).length;
    const activeSecurity = security.filter(s => s.is_active).length;

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-xl font-bold text-gray-800">
                    Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    System overview and user management.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon="🎓" label={`Students (${activeStudents} active)`} value={students.length} color="blue" />
                <StatCard icon= "🛡️" label={`Wardens (${activeWardens} active)`}   value={wardens.length}  color="green" />
                <StatCard icon="👮" label={`Security (${activeSecurity} active)`} value={security.length} color="yellow" />
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-4">⚡ Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Link to="/admin/create"
                        className="bg-blue-800 text-white text-sm font-semibold
                                  px-4 py-3 rounded-lg hover:bg-blue-900
                                  transition-colors text-center">
                        ➕ Create User
                    </Link>
                    <Link to="/admin/students"
                        className="border-2 border-gray-200 text-gray-700 text-sm
                                  font-semibold px-4 py-3 rounded-lg hover:bg-gray-50
                                  transition-colors text-center">
                        🎓 Manage Students
                    </Link>
                    <Link to="/admin/wardens"
                        className="border-2 border-gray-200 text-gray-700 text-sm
                                  font-semibold px-4 py-3 rounded-lg hover:bg-gray-50
                                  transition-colors text-center">
                        🛡️ Manage Wardens
                    </Link>
                    <Link to="/admin/security"
                        className="border-2 border-gray-200 text-gray-700 text-sm
                                  font-semibold px-4 py-3 rounded-lg hover:bg-gray-50
                                  transition-colors text-center">
                        👮 Manage Security
                    </Link>
                </div>
            </div>

            {/* Recent students */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center
                                justify-between">
                    <h2 className="text-sm font-bold text-gray-700">🎓 Recent Students</h2>
                    <Link to="/admin/students" className="text-xs text-blue-700
                                font-semibold hover:underline">
                        View All →
                    </Link>
                </div>
                {students.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p className="text-3xl mb-2">🎓</p>
                        <p className="text-sm">No students yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {students.slice(0, 6).map(s => (
                            <div key={s.id} className="px-5 py-3 flex items-center
                                       justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {s.name} <span className="text-gray-400">({s.id})</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Room {s.room || '—'} · {s.course || '—'} · {s.year || '—'}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold px-2.5 py-1
                                                rounded-full whitespace-nowrap
                                                ${s.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-500'}`}>
                                    {s.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;