// src/pages/security/SecurityDashboard.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import securityApi from '../../api/securityApi';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import useAuth from '../../hooks/useAuth';
import { formatDateTime12h } from '../../utils/dateFormat';
import usePageTitle from '../../hooks/usePageTitle';

function SecurityDashboard() {
    usePageTitle('Security Dashboard');

    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [currentlyOut, setCurrentlyOut] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAll();
        // Refresh live stats every 60s — keeps "live" cards current
        // without requiring a manual refresh
        const interval = setInterval(loadAll, 60000);
        return () => clearInterval(interval);
    }, []);

    async function loadAll() {
        try {
            const [statsData, outData] = await Promise.all([
                securityApi.getStats(),
                securityApi.getCurrentlyOut(),
            ]);
            setStats(statsData);
            setCurrentlyOut(outData);
        } catch (err) {
            console.error('Dashboard load error:', err);
            toast.error('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }

    if (loading || !stats) return <LoadingSpinner text="Loading dashboard..." />;

    const { live, today, week, month, overall } = stats;

    // Rows for the activity overview table
    const periods = [
        { label: 'Today',      data: today },
        { label: 'This Week',  data: week },
        { label: 'This Month', data: month },
        { label: 'Overall',    data: overall },
    ];

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-xl font-bold text-gray-800">
                    Welcome back, {user?.name?.split(' ')[0] || 'Security'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Monitor student movement in and out of the hostel.
                </p>
            </div>

            {/* ── Live stats ──────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-700">Live Status</h2>
                    <span className="text-xs text-gray-400">
                        Auto-refreshes every minute
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon="✅" label="Total Approved" value={live.total_approved} color="blue" />
                    <StatCard icon="🏠" label="Inside Hostel"  value={live.inside}         color="green" />
                    <StatCard icon="🚶" label="Currently Out"  value={live.out}            color="yellow" />
                    <StatCard icon="⚠️" label="Overdue"        value={live.overdue}        color="red" />
                </div>
            </div>

            {/* Overdue alert */}
            {live.overdue > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4
                                flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <p className="text-sm font-bold text-red-800">
                                {live.overdue} student{live.overdue > 1 ? 's' : ''} overdue for return
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

            {/* ── Activity overview — Today/Week/Month/Overall ── */}
            <div>
                <h2 className="text-sm font-bold text-gray-700 mb-3">Activity Overview</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase
                                           border-b border-gray-100">
                                <th className="px-5 py-3">Period</th>
                                <th className="px-3 py-3">Gate Pass Requests</th>
                                <th className="px-3 py-3">Exits Recorded</th>
                                <th className="px-3 py-3">Returns Recorded</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(({ label, data }) => (
                                <tr key={label} className="border-b border-gray-50
                                           last:border-b-0 hover:bg-gray-50">
                                    <td className="px-5 py-3 font-semibold text-gray-800">
                                        {label}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="inline-flex items-center justify-center
                                                        min-w-[2.5rem] bg-blue-50 text-blue-700
                                                        font-semibold rounded-lg px-2 py-1 text-xs">
                                            {data.gate_passes}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="inline-flex items-center justify-center
                                                        min-w-[2.5rem] bg-orange-50 text-orange-700
                                                        font-semibold rounded-lg px-2 py-1 text-xs">
                                            {data.exits}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="inline-flex items-center justify-center
                                                        min-w-[2.5rem] bg-green-50 text-green-700
                                                        font-semibold rounded-lg px-2 py-1 text-xs">
                                            {data.returns}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    "This Week" starts Monday · "This Month" starts on the 1st ·
                    "Overall" covers all-time records.
                </p>
            </div>

            {/* ── Currently out list ──────────────────────── */}
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