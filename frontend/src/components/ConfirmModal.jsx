// src/components/ConfirmModal.jsx

import { useState } from 'react';

// isOpen     — controls visibility
// title      — modal heading text
// remarksLabel — label for the textarea (e.g. "Approval Remarks")
// confirmLabel — button text (e.g. "Approve")
// confirmColor — 'green' | 'red'
// onConfirm  — async function(remarks) — called when confirmed
// onClose    — closes the modal
function ConfirmModal({
    isOpen,
    title,
    remarksLabel = 'Remarks (optional)',
    confirmLabel = 'Confirm',
    confirmColor = 'green',
    onConfirm,
    onClose,
}) {
    const [remarks, setRemarks]   = useState('');
    const [loading, setLoading]   = useState(false);

    if (!isOpen) return null;

    const colorClasses = confirmColor === 'red'
        ? 'bg-red-600 hover:bg-red-700'
        : 'bg-green-600 hover:bg-green-700';

    async function handleConfirm() {
        setLoading(true);
        try {
            await onConfirm(remarks);
            setRemarks('');
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setRemarks('');
        onClose();
    }

    return (
        // Backdrop
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                        justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full
                            animate-fadeInUp">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-800">{title}</h3>
                </div>

                <div className="p-5">
                    <label className="block text-xs font-semibold text-gray-500
                                      uppercase mb-1.5">{remarksLabel}</label>
                    <textarea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add a note..."
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                  text-sm focus:border-blue-600 focus:outline-none
                                  bg-gray-50 resize-none"
                    />
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="border-2 border-gray-200 text-gray-600 text-sm
                                  font-semibold px-4 py-2 rounded-lg hover:bg-gray-50
                                  disabled:opacity-60 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`text-white text-sm font-semibold px-4 py-2
                                   rounded-lg disabled:opacity-60 transition-colors
                                   ${colorClasses}`}
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;