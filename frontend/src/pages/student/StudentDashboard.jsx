// src/pages/student/StudentDashboard.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import studentApi from '../../api/studentApi';
import StatCard from '../../components/StatCard';
import ActivityOverviewTable from '../../components/ActivityOverviewTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import useAuth from '../../hooks/useAuth';
import { formatDateTime12h, formatTableDate } from '../../utils/dateFormat';
import usePageTitle from '../../hooks/usePageTitle';

function StudentDashboard() {
    usePageTitle('Dashboard');

    const { user } = useAuth();
    const [passes,  setPasses]  = useState([]);
    const [stats,   setStats]   = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAll();
        const interval = setInterval(loadAll, 60000);
        return () => clearInterval(interval);
    }, []);

    async function loadAll() {
        try {
            const [passesData, statsData] = await Promise.all([
                studentApi.getGatePasses(),
                studentApi.getStats(),
            ]);
            setPasses(passesData);
            setStats(statsData);
        } catch {
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }

    if (loading || !stats) return <LoadingSpinner text="Loading dashboard..." />;

    const { live } = stats;
    const currentlyOut = passes.find(
        p => p.status === 'Approved' && p.exit_status === 'Out'
    );

    const columns = [
        { key: 'requests_made',    label: 'Requests Made', color: 'blue' },
        { key: 'approved',         label: 'Approved',      color: 'green' },
        { key: 'rejected',         label: 'Rejected',      color: 'red' },
        { key: 'trips_completed',  label: 'Trips Completed', color: 'purple' },
    ];

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-xl font-bold text-gray-800">
                    Welcome back, {user?.name?.split(' ')[0] || 'Student'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Room {user?.room || '—'} · {user?.course || '—'} · {user?.year || '—'}
                </p>
            </div>

            {/* Current status banner */}
            <div className={`rounded-xl border-2 p-4 flex items-center gap-3
                            ${live.currently_out
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-green-50 border-green-200'}`}>
                <div className="text-3xl">{live.currently_out ? '🚶' : '🏠'}</div>
                <div>
                    <p className={`text-sm font-bold
                                  ${live.currently_out ? 'text-orange-800' : 'text-green-800'}`}>
                        {live.currently_out ? 'Currently Out of Hostel' : 'Currently In Hostel'}
                    </p>
                    {live.currently_out && currentlyOut && (
                        <p className="text-xs text-orange-600 mt-0.5">
                            Out since {formatDateTime12h(currentlyOut.actual_out_time)}
                            {' · '}Expected return: {formatDateTime12h(currentlyOut.return_date, currentlyOut.return_time)}
                        </p>
                    )}
                </div>
            </div>

            {/* Live stats */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-700">Live Status</h2>
                    <span className="text-xs text-gray-400">Auto-refreshes every minute</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon="🪪" label="Total Passes" value={live.total}    color="blue" />
                    <StatCard icon="✅" label="Approved"      value={live.approved} color="green" />
                    <StatCard icon="⏳" label="Pending"       value={live.pending}  color="yellow" />
                    <StatCard icon="❌" label="Rejected"      value={live.rejected} color="red" />
                </div>
            </div>

            {/* Activity overview */}
            <ActivityOverviewTable columns={columns} stats={stats} />

            {/* Quick action */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5
                            flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-sm font-bold text-gray-700">Need to go out?</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Submit a new gate pass request for warden approval.
                    </p>
                </div>
                <Link
                    to="/student/gatepasses"
                    className="bg-blue-800 text-white text-sm font-semibold
                              px-5 py-2.5 rounded-lg hover:bg-blue-900
                              transition-colors whitespace-nowrap"
                >
                    ➕ New Gate Pass
                </Link>
            </div>

            {/* Recent passes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-700">📋 Recent Requests</h2>
                </div>
                {passes.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm">No gate passes yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {passes.slice(0, 5).map(p => (
                            <div key={p.pass_id} className="px-5 py-3 flex items-center
                                       justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {p.reason}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {p.going_place} · {formatTableDate(p.out_date)}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold px-2.5 py-1
                                                rounded-full whitespace-nowrap
                                                ${p.status === 'Approved' ? 'bg-green-100 text-green-800'
                                                  : p.status === 'Rejected' ? 'bg-red-100 text-red-800'
                                                  : 'bg-yellow-100 text-yellow-800'}`}>
                                    {p.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;