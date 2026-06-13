// src/pages/security/SecurityDashboard.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import securityApi from '../../api/securityApi';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import useAuth from '../../hooks/useAuth';
import { formatDateTime12h } from '../../utils/dateFormat';

function SecurityDashboard() {
    const { user } = useAuth();
    const [approved, setApproved] = useState([]);
    const [currentlyOut, setCurrentlyOut] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [approvedData, outData] = await Promise.all([
                securityApi.getApproved(),
                securityApi.getCurrentlyOut(),
            ]);
            setApproved(approvedData);
            setCurrentlyOut(outData);
        } catch {
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LoadingSpinner text="Loading dashboard..." />;

    // ── Derived stats — count UNIQUE STUDENTS, not gate passes ─────
    // Set of student_ids deduplicates automatically
    const totalApprovedStudents = new Set(approved.map(p => p.student_id)).size;

    // Currently out — student_ids from the currentlyOut endpoint
    const outStudentIds = new Set(currentlyOut.map(p => p.student_id));
    const outCount = outStudentIds.size;

    // Inside = total approved students - currently out students
    const insideCount = totalApprovedStudents - outCount;

    // Overdue — unique students whose expected return has passed
    const overdueStudentIds = new Set(
        currentlyOut
            .filter(p => new Date() > new Date(`${p.return_date}T${p.return_time}`))
            .map(p => p.student_id)
    );
    const overdueCount = overdueStudentIds.size;

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-xl font-bold text-gray-800">
                    Welcome back, {user?.name?.split(' ')[0] || 'Security'} 👋
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Monitor student movement in and out of the hostel.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="✅" label="Total Approved" value={totalApprovedStudents} color="blue" />
                <StatCard icon="🏠" label="Inside Hostel"  value={insideCount}           color="green" />
                <StatCard icon="🚶" label="Currently Out"  value={outCount}              color="yellow" />
                <StatCard icon="⚠️" label="Overdue"        value={overdueCount}          color="red" />
            </div>

            {/* Overdue alert */}
            {overdueCount > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4
                                flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <p className="text-sm font-bold text-red-800">
                                {overdueCount} student{overdueCount > 1 ? 's' : ''} overdue for return
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">
                                Expected return time has passed.
                            </p>
                        </div>
                    </div>
                    <Link to="/security/out"
                        className="bg-red-500 text-white text-sm font-semibold
                                  px-5 py-2.5 rounded-lg hover:bg-red-600
                                  transition-colors whitespace-nowrap">
                        View Details →
                    </Link>
                </div>
            )}

            {/* Currently out list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center
                                justify-between">
                    <h2 className="text-sm font-bold text-gray-700">🚶 Currently Out</h2>
                    <Link to="/security/out" className="text-xs text-blue-700
                                font-semibold hover:underline">
                        View All →
                    </Link>
                </div>
                {currentlyOut.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p className="text-3xl mb-2">🏠</p>
                        <p className="text-sm">Everyone is inside the hostel.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {currentlyOut.slice(0, 6).map(p => (
                            <div key={p.pass_id} className="px-5 py-3 flex items-center
                                       justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {p.student_name} <span className="text-gray-400">
                                            ({p.student_id})</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Room {p.room_no} · Out since {formatDateTime12h(p.actual_out_time)}
                                    </p>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1
                                                rounded-full bg-orange-100 text-orange-800
                                                whitespace-nowrap">
                                    Out
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SecurityDashboard;