// src/pages/warden/AllGatePasses.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import wardenApi from '../../api/wardenApi';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatTableDate, formatTime12h } from '../../utils/dateFormat';

function AllGatePasses() {
    const [passes,  setPasses]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await wardenApi.getAllGatePasses();
            setPasses(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch {
            toast.error('Failed to load gate passes.');
        } finally {
            setLoading(false);
        }
    }

    // ── Client-side filtering ────────────────────────────
    const filtered = passes.filter(p => {
        const matchesSearch = !search ||
            p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.student_id?.toLowerCase().includes(search.toLowerCase()) ||
            p.going_place?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !statusFilter || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) return <LoadingSpinner text="Loading gate passes..." />;

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-gray-800">📋 All Gate Passes</h1>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4
                            flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="🔍 Search by student, ID, destination..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] border-2 border-gray-200 rounded-lg
                              px-3 py-2 text-sm focus:border-blue-600 focus:outline-none
                              bg-gray-50"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm
                              focus:border-blue-600 focus:outline-none bg-gray-50"
                >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <button onClick={load}
                    className="text-xs text-blue-700 font-semibold hover:underline">
                    🔄 Refresh
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100
                            overflow-x-auto">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm">No gate passes found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase
                                           border-b border-gray-100">
                                <th className="px-5 py-3">Student</th>
                                <th className="px-3 py-3">Pass #</th>
                                <th className="px-3 py-3">Reason</th>
                                <th className="px-3 py-3">Destination</th>
                                <th className="px-3 py-3">Out</th>
                                <th className="px-3 py-3">Return</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3">Exit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.pass_id} className="border-b border-gray-50
                                           hover:bg-gray-50">
                                    <td className="px-5 py-3">
                                        <p className="font-semibold text-gray-800">{p.student_name}</p>
                                        <p className="text-xs text-gray-400">{p.student_id} · Room {p.room_no}</p>
                                    </td>
                                    <td className="px-3 py-3 font-mono text-xs text-gray-500">
                                        {p.pass_number || '—'}
                                    </td>
                                    <td className="px-3 py-3 max-w-[140px] truncate" title={p.reason}>
                                        {p.reason}
                                    </td>
                                    <td className="px-3 py-3">{p.going_place}</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                        {formatTableDate(p.out_date)}<br/>{formatTime12h(p.out_time)}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                        {formatTableDate(p.return_date)}<br/>{formatTime12h(p.return_time)}
                                    </td>
                                    <td className="px-3 py-3"><Badge status={p.status} /></td>
                                    <td className="px-3 py-3"><Badge status={p.exit_status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default AllGatePasses;
