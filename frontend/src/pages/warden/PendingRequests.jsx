// src/pages/warden/PendingRequests.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import wardenApi from '../../api/wardenApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { formatTableDate, formatTime12h } from '../../utils/dateFormat';
import usePageTitle from '../../hooks/usePageTitle';
function PendingRequests() {
    const [passes,  setPasses]  = useState([]);
    const [loading, setLoading] = useState(true);
    usePageTitle('Pending Requests');
    // modal state — which pass + which action (approve/reject)
    const [modal, setModal] = useState({ open: false, pass: null, action: null });

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await wardenApi.getPending();
            setPasses(data);
        } catch {
            toast.error('Failed to load pending requests.');
        } finally {
            setLoading(false);
        }
    }

    function openModal(pass, action) {
        setModal({ open: true, pass, action });
    }

    function closeModal() {
        setModal({ open: false, pass: null, action: null });
    }

    async function handleConfirm(remarks) {
        const { pass, action } = modal;
        try {
            if (action === 'approve') {
                await wardenApi.approve(pass.pass_id, remarks);
                toast.success(`${pass.pass_number || 'Gate pass'} approved!`);
            } else {
                await wardenApi.reject(pass.pass_id, remarks);
                toast.success(`${pass.pass_number || 'Gate pass'} rejected.`);
            }
            closeModal();
            load(); // refresh list
        } catch (err) {
            toast.error(err.response?.data?.detail || `Failed to ${action}.`);
        }
    }

    if (loading) return <LoadingSpinner text="Loading pending requests..." />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">
                    ⏳ Pending Requests
                    {passes.length > 0 && (
                        <span className="ml-2 text-sm font-semibold text-orange-600
                                         bg-orange-100 px-2.5 py-0.5 rounded-full">
                            {passes.length}
                        </span>
                    )}
                </h1>
                <button onClick={load}
                    className="text-xs text-blue-700 font-semibold hover:underline">
                    🔄 Refresh
                </button>
            </div>

            {passes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100
                                text-center py-16 text-gray-400">
                    <p className="text-4xl mb-2">✅</p>
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs mt-1">No pending requests right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {passes.map(p => (
                        <div key={p.pass_id} className="bg-white rounded-xl shadow-sm
                                   border border-gray-100 p-4 flex flex-col gap-3">

                            {/* Student info */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br
                                                from-blue-800 to-blue-500 flex items-center
                                                justify-center text-white text-sm font-bold
                                                flex-shrink-0">
                                    {p.student_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">
                                        {p.student_name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {p.student_id} · Room {p.room_no}
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="text-xs text-gray-600 space-y-1 bg-gray-50
                                            rounded-lg p-3">
                                <p><span className="font-semibold">Reason:</span> {p.reason}</p>
                                <p><span className="font-semibold">Going to:</span> {p.going_place}</p>
                                <p>
                                    <span className="font-semibold">Out:</span>{' '}
                                    {formatTableDate(p.out_date)} {formatTime12h(p.out_time)}
                                </p>
                                <p>
                                    <span className="font-semibold">Return:</span>{' '}
                                    {formatTableDate(p.return_date)} {formatTime12h(p.return_time)}
                                </p>
                                {p.pass_number && (
                                    <p className="font-mono text-blue-700">{p.pass_number}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => openModal(p, 'approve')}
                                    className="flex-1 bg-green-600 text-white text-xs
                                              font-semibold py-2 rounded-lg
                                              hover:bg-green-700 transition-colors"
                                >
                                    ✅ Approve
                                </button>
                                <button
                                    onClick={() => openModal(p, 'reject')}
                                    className="flex-1 bg-red-500 text-white text-xs
                                              font-semibold py-2 rounded-lg
                                              hover:bg-red-600 transition-colors"
                                >
                                    ❌ Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={modal.open}
                title={
                    modal.action === 'approve'
                        ? `Approve gate pass for ${modal.pass?.student_name}?`
                        : `Reject gate pass for ${modal.pass?.student_name}?`
                }
                remarksLabel={modal.action === 'approve' ? 'Approval Remarks' : 'Rejection Reason'}
                confirmLabel={modal.action === 'approve' ? 'Approve' : 'Reject'}
                confirmColor={modal.action === 'approve' ? 'green' : 'red'}
                onConfirm={handleConfirm}
                onClose={closeModal}
            />
        </div>
    );
}

export default PendingRequests;