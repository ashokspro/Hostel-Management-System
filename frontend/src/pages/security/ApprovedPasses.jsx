// src/pages/security/ApprovedPasses.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import securityApi from '../../api/securityApi';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { formatTableDate, formatTime12h } from '../../utils/dateFormat';

function ApprovedPasses() {
    const [passes,  setPasses]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    // modal now needs an "action" — 'exit' or 'return'
    const [modal, setModal] = useState({ open: false, pass: null, action: null });

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await securityApi.getApproved();
            setPasses(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch {
            toast.error('Failed to load approved passes.');
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

    function openModal(pass, action) {
        setModal({ open: true, pass, action });
    }

    function closeModal() {
        setModal({ open: false, pass: null, action: null });
    }

    async function handleConfirm(remarks) {
        const { pass, action } = modal;
        try {
            if (action === 'exit') {
                await securityApi.markExit(pass.pass_id, remarks);
                toast.success(`${pass.student_name} marked as exited.`);
            } else {
                await securityApi.markReturn(pass.pass_id, remarks);
                toast.success(`${pass.student_name} marked as returned.`);
            }
            closeModal();
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || `Failed to mark ${action}.`);
        }
    }

    // ── Determine the action for a row ────────────────────
    // Never exited yet → can mark exit
    // Currently out → can mark return
    // Completed (exited and returned) → no action
    function getRowAction(p) {
        if (p.exit_status === 'Out') return 'return';
        if (p.exit_status === 'In' && !p.actual_return_time) return 'exit';
        return null; // completed cycle
    }

    if (loading) return <LoadingSpinner text="Loading approved passes..." />;

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-gray-800">✅ Approved Gate Passes</h1>

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
                        <p className="text-sm">No approved gate passes found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase
                                           border-b border-gray-100">
                                <th className="px-5 py-3">Student</th>
                                <th className="px-3 py-3">Pass #</th>
                                <th className="px-3 py-3">Destination</th>
                                <th className="px-3 py-3">Out</th>
                                <th className="px-3 py-3">Return</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const action = getRowAction(p);
                                return (
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
                                        <td className="px-3 py-3"><Badge status={p.exit_status} /></td>
                                        <td className="px-3 py-3">
                                            {action === 'exit' && (
                                                <button
                                                    onClick={() => openModal(p, 'exit')}
                                                    className="bg-orange-500 text-white text-xs
                                                              font-semibold px-3 py-1.5 rounded-lg
                                                              hover:bg-orange-600 transition-colors
                                                              whitespace-nowrap"
                                                >
                                                    🚶 Mark Exit
                                                </button>
                                            )}
                                            {action === 'return' && (
                                                <button
                                                    onClick={() => openModal(p, 'return')}
                                                    className="bg-green-600 text-white text-xs
                                                              font-semibold px-3 py-1.5 rounded-lg
                                                              hover:bg-green-700 transition-colors
                                                              whitespace-nowrap"
                                                >
                                                    🏠 Mark Return
                                                </button>
                                            )}
                                            {action === null && (
                                                <span className="text-xs text-gray-400 font-medium">
                                                    ✅ Completed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmModal
                isOpen={modal.open}
                title={
                    modal.action === 'exit'
                        ? `Mark ${modal.pass?.student_name} as exited?`
                        : `Mark ${modal.pass?.student_name} as returned?`
                }
                remarksLabel={modal.action === 'exit' ? 'Exit Remarks (optional)' : 'Return Remarks (optional)'}
                confirmLabel={modal.action === 'exit' ? 'Mark Exit' : 'Mark Return'}
                confirmColor="green"
                onConfirm={handleConfirm}
                onClose={closeModal}
            />
        </div>
    );
}

export default ApprovedPasses;