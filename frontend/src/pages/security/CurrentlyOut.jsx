// src/pages/security/CurrentlyOut.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import securityApi from '../../api/securityApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { formatTableDate, formatTime12h, formatDateTime12h } from '../../utils/dateFormat';
import usePageTitle from '../../hooks/usePageTitle';

function CurrentlyOut() {
    const [passes,  setPasses]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, pass: null });
    usePageTitle('Currently Out');
    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await securityApi.getCurrentlyOut();
            setPasses(data);
        } catch {
            toast.error('Failed to load currently-out students.');
        } finally {
            setLoading(false);
        }
    }

    function openModal(pass) {
        setModal({ open: true, pass });
    }

    function closeModal() {
        setModal({ open: false, pass: null });
    }

    async function handleConfirmReturn(remarks) {
        const { pass } = modal;
        try {
            await securityApi.markReturn(pass.pass_id, remarks);
            toast.success(`${pass.student_name} marked as returned.`);
            closeModal();
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to mark return.');
        }
    }

    // Is the student overdue? (current time past expected return)
    function isOverdue(pass) {
        const expectedReturn = new Date(`${pass.return_date}T${pass.return_time}`);
        return new Date() > expectedReturn;
    }

    if (loading) return <LoadingSpinner text="Loading currently-out students..." />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">
                    🚶 Currently Out
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
                    <p className="text-4xl mb-2">🏠</p>
                    <p className="text-sm font-medium">Everyone is inside!</p>
                    <p className="text-xs mt-1">No students are currently out.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {passes.map(p => {
                        const overdue = isOverdue(p);
                        return (
                            <div key={p.pass_id} className={`bg-white rounded-xl shadow-sm
                                       border-2 p-4 flex flex-col gap-3
                                       ${overdue ? 'border-red-300' : 'border-gray-100'}`}>

                                {/* Student info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br
                                                    from-orange-500 to-orange-400 flex items-center
                                                    justify-center text-white text-sm font-bold
                                                    flex-shrink-0">
                                        {p.student_name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-800 truncate">
                                            {p.student_name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {p.student_id} · Room {p.room_no}
                                        </p>
                                    </div>
                                    {overdue && (
                                        <span className="text-xs font-bold text-red-600
                                                         bg-red-100 px-2 py-1 rounded-full
                                                         whitespace-nowrap">
                                            ⚠️ Overdue
                                        </span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="text-xs text-gray-600 space-y-1 bg-gray-50
                                                rounded-lg p-3">
                                    <p><span className="font-semibold">Destination:</span> {p.going_place}</p>
                                    <p>
                                        <span className="font-semibold">Exited at:</span>{' '}
                                        {formatDateTime12h(p.actual_out_time)}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Expected return:</span>{' '}
                                        {formatTableDate(p.return_date)} {formatTime12h(p.return_time)}
                                    </p>
                                    {p.pass_number && (
                                        <p className="font-mono text-blue-700">{p.pass_number}</p>
                                    )}
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => openModal(p)}
                                    className="bg-green-600 text-white text-xs font-semibold
                                              py-2 rounded-lg hover:bg-green-700
                                              transition-colors mt-auto"
                                >
                                    🏠 Mark Return
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmModal
                isOpen={modal.open}
                title={`Mark ${modal.pass?.student_name} as returned?`}
                remarksLabel="Return Remarks (optional)"
                confirmLabel="Mark Return"
                confirmColor="green"
                onConfirm={handleConfirmReturn}
                onClose={closeModal}
            />
        </div>
    );
}

export default CurrentlyOut;