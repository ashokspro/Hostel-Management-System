// src/pages/security/History.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import securityApi from '../../api/securityApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatTableDate, formatTime12h, formatDateTime12h } from '../../utils/dateFormat';
import usePageTitle from '../../hooks/usePageTitle';

function History() {
    const [passes,  setPasses]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    usePageTitle('History')
    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await securityApi.getHistory();
            setPasses(data);
        } catch {
            toast.error('Failed to load history.');
        } finally {
            setLoading(false);
        }
    }

    const filtered = passes.filter(p =>
        !search ||
        p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.student_id?.toLowerCase().includes(search.toLowerCase()) ||
        p.room_no?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <LoadingSpinner text="Loading history..." />;

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-gray-800">📜 Completed History</h1>
            <p className="text-xs text-gray-400 -mt-2">
                Students who have exited and returned successfully.
            </p>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4
                            flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="🔍 Search by student, ID, or room..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] border-2 border-gray-200 rounded-lg
                              px-3 py-2 text-sm focus:border-blue-600 focus:outline-none
                              bg-gray-50"
                />
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
                        <p className="text-sm">No completed gate passes yet.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase
                                           border-b border-gray-100">
                                <th className="px-5 py-3">Student</th>
                                <th className="px-3 py-3">Pass #</th>
                                <th className="px-3 py-3">Destination</th>
                                <th className="px-3 py-3">Planned Out</th>
                                <th className="px-3 py-3">Planned Return</th>
                                <th className="px-3 py-3">Actual Exit</th>
                                <th className="px-3 py-3">Actual Return</th>
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
                                    <td className="px-3 py-3">{p.going_place}</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                        {formatTableDate(p.out_date)}<br/>{formatTime12h(p.out_time)}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                        {formatTableDate(p.return_date)}<br/>{formatTime12h(p.return_time)}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                        {formatDateTime12h(p.actual_out_time)}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                        {formatDateTime12h(p.actual_return_time)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default History;