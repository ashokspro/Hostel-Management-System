// src/pages/warden/WardenDashboard.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import wardenApi from '../../api/wardenApi';
import StatCard from '../../components/StatCard';
import ActivityOverviewTable from '../../components/ActivityOverviewTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';
import useAuth from '../../hooks/useAuth';
import { formatTableDate, formatTime12h } from '../../utils/dateFormat';
import usePageTitle from '../../hooks/usePageTitle';

function WardenDashboard() {
    usePageTitle('Warden Dashboard');

    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [allPasses, setAllPasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 60000);
        return () => clearInterval(interval);
    }, []);

    async function loadAll() {
        try {
            const [statsData, allData] = await Promise.all([
                wardenApi.getStats(),
                wardenApi.getAllGatePasses(),
            ]);
            setStats(statsData);
            setAllPasses(allData);
        } catch {
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }

    if (loading || !stats) return <LoadingSpinner text="Loading dashboard..." />;

    const { live } = stats;

    const columns = [
        { key: 'requests_received', label: 'Requests Received', color: 'blue' },
        { key: 'approved',          label: 'Approved',          color: 'green' },
        { key: 'rejected',          label: 'Rejected',          color: 'red' },
    ];

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-xl font-bold text-gray-800">
                    Welcome back, {user?.name?.split(' ')[0] || 'Warden'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Here's what's happening in the hostel today.
                </p>
            </div>

            {/* Live stats */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-700">Live Status</h2>
                    <span className="text-xs text-gray-400">Auto-refreshes every minute</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon="⏳" label="Pending Requests" value={live.pending_requests} color="yellow" />
                    <StatCard icon="✅" label="Total Approved"   value={live.total_approved}    color="green" />
                    <StatCard icon="🚶" label="Currently Out"    value={live.currently_out}     color="red" />
                    <StatCard icon="🎓" label="Total Students"   value={live.total_students}    color="blue" />
                </div>
            </div>

            {/* Pending alert */}
            {live.pending_requests > 0 && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl
                                p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⏳</span>
                        <div>
                            <p className="text-sm font-bold text-orange-800">
                                {live.pending_requests} request{live.pending_requests > 1 ? 's' : ''} awaiting your approval
                            </p>
                            <p className="text-xs text-orange-600 mt-0.5">
                                Students are waiting for a response.
                            </p>
                        </div>
                    </div>
                    <Link to="/warden/pending"
                        className="bg-orange-500 text-white text-sm font-semibold
                                  px-5 py-2.5 rounded-lg hover:bg-orange-600
                                  transition-colors whitespace-nowrap">
                        Review Now →
                    </Link>
                </div>
            )}

            {/* Activity overview */}
            <ActivityOverviewTable columns={columns} stats={stats} />

            {/* Recent gate passes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center
                                justify-between">
                    <h2 className="text-sm font-bold text-gray-700">📋 Recent Gate Passes</h2>
                    <Link to="/warden/gatepasses" className="text-xs text-blue-700
                                font-semibold hover:underline">
                        View All →
                    </Link>
                </div>
                {allPasses.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm">No gate passes yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase
                                               border-b border-gray-100">
                                    <th className="px-5 py-3">Student</th>
                                    <th className="px-3 py-3">Destination</th>
                                    <th className="px-3 py-3">Out</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Exit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allPasses.slice(0, 6).map(p => (
                                    <tr key={p.pass_id} className="border-b border-gray-50
                                               hover:bg-gray-50">
                                        <td className="px-5 py-3">
                                            <p className="font-semibold text-gray-800">{p.student_name}</p>
                                            <p className="text-xs text-gray-400">{p.student_id}</p>
                                        </td>
                                        <td className="px-3 py-3">{p.going_place}</td>
                                        <td className="px-3 py-3 text-xs whitespace-nowrap">
                                            {formatTableDate(p.out_date)} {formatTime12h(p.out_time)}
                                        </td>
                                        <td className="px-3 py-3"><Badge status={p.status} /></td>
                                        <td className="px-3 py-3"><Badge status={p.exit_status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WardenDashboard;