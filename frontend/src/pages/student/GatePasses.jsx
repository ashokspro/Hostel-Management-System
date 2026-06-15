// src/pages/student/GatePasses.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import studentApi  from '../../api/studentApi';
import gatepassApi from '../../api/gatepassApi';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatTableDate, formatTime12h } from '../../utils/dateFormat';
import usePageTitle from '../../hooks/usePageTitle';


const initialForm = {
    reason: '',
    going_place: '',
    out_date: '',
    out_time: '',
    return_date: '',
    return_time: '',
};

function GatePasses() {
    const [passes,  setPasses]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(initialForm);
    usePageTitle('Gate Passes');

    useEffect(() => {
        loadPasses();
    }, []);

    async function loadPasses() {
        setLoading(true);
        try {
            const data = await studentApi.getGatePasses();
            // Newest first
            setPasses(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch {
            toast.error('Failed to load gate passes.');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
    e.preventDefault();

    // ── Client-side validation ──────────────────────────────
    const outDateTime    = new Date(`${form.out_date}T${form.out_time}`);
    const returnDateTime = new Date(`${form.return_date}T${form.return_time}`);

    if (returnDateTime <= outDateTime) {
        toast.error('Return date/time must be after the departure date/time.');
        return;
    }

    const payload = {
        ...form,
        out_time: form.out_time + ':00',
        return_time: form.return_time + ':00',
    };

    setSubmitting(true);
    try {
        await studentApi.createGatePass(payload);
        toast.success('Gate pass request submitted!');
        setForm(initialForm);
        loadPasses();
    } catch (err) {
        // ── Robust error extraction ────────────────────────
        const detail = err.response?.data?.detail;
        let message = 'Failed to submit request.';

        if (typeof detail === 'string') {
            // FastAPI HTTPException — plain string
            message = detail;
        } else if (Array.isArray(detail)) {
            // Pydantic validation error — array of {msg, loc, ...}
            message = detail[0]?.msg || message;
        } else if (!err.response) {
            // Network error — no response at all
            message = 'Cannot connect to server.';
        }

        toast.error(message);
    } finally {
        setSubmitting(false);
    }
}

    async function handleDownload(passId, passNumber) {
        try {
            await gatepassApi.downloadPDF(passId, passNumber);
        } catch {
            toast.error('Failed to download PDF.');
        }
    }

    // Today's date in YYYY-MM-DD — used as min for date inputs
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-gray-800">Gate Passes</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Create form ──────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h2 className="text-sm font-bold text-gray-700 mb-4">
                            ➕ Request New Gate Pass
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold
                                                  text-gray-500 uppercase mb-1">Reason</label>
                                <textarea
                                    name="reason" required rows={2}
                                    value={form.reason} onChange={handleChange}
                                    placeholder="Why are you going out?"
                                    className="w-full border-2 border-gray-200 rounded-lg
                                              px-3 py-2 text-sm focus:border-blue-600
                                              focus:outline-none bg-gray-50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold
                                                  text-gray-500 uppercase mb-1">Going To</label>
                                <input
                                    name="going_place" required
                                    value={form.going_place} onChange={handleChange}
                                    placeholder="Destination"
                                    className="w-full border-2 border-gray-200 rounded-lg
                                              px-3 py-2 text-sm focus:border-blue-600
                                              focus:outline-none bg-gray-50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold
                                                      text-gray-500 uppercase mb-1">Out Date</label>
                                    <input
                                        type="date" name="out_date" required min={today}
                                        value={form.out_date} onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg
                                                  px-2 py-2 text-sm focus:border-blue-600
                                                  focus:outline-none bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold
                                                      text-gray-500 uppercase mb-1">Out Time</label>
                                    <input
                                        type="time" name="out_time" required
                                        value={form.out_time} onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg
                                                  px-2 py-2 text-sm focus:border-blue-600
                                                  focus:outline-none bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold
                                                      text-gray-500 uppercase mb-1">Return Date</label>
                                    <input
                                        type="date" name="return_date" required min={form.out_date || today}
                                        value={form.return_date} onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg
                                                  px-2 py-2 text-sm focus:border-blue-600
                                                  focus:outline-none bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold
                                                      text-gray-500 uppercase mb-1">Return Time</label>
                                    <input
                                        type="time" name="return_time" required
                                        value={form.return_time} onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg
                                                  px-2 py-2 text-sm focus:border-blue-600
                                                  focus:outline-none bg-gray-50"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={submitting}
                                className="w-full bg-blue-800 text-white text-sm
                                          font-semibold py-2.5 rounded-lg
                                          hover:bg-blue-900 disabled:opacity-60
                                          transition-colors mt-2"
                            >
                                {submitting ? 'Submitting...' : '📨 Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── History table ─────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="px-5 py-4 border-b border-gray-100 flex
                                        items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-700">
                                📋 My Gate Pass History
                            </h2>
                            <button
                                onClick={loadPasses}
                                className="text-xs text-blue-700 font-semibold
                                          hover:underline"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {loading ? (
                            <LoadingSpinner />
                        ) : passes.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="text-3xl mb-2">📭</p>
                                <p className="text-sm">No gate passes yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
    <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
        <th className="px-5 py-3">Pass #</th>
        <th className="px-3 py-3">Reason</th>
        <th className="px-3 py-3">Destination</th>
        <th className="px-3 py-3">Out</th>
        <th className="px-3 py-3">Return</th>
        <th className="px-3 py-3">Status</th>
        <th className="px-3 py-3">Remarks</th>
        <th className="px-3 py-3">Exit</th>
        <th className="px-3 py-3"></th>
    </tr>
</thead>
                                    <tbody>
                                        {passes.map(p => (
                                            <tr key={p.pass_id} className="border-b
                                                       border-gray-50 hover:bg-gray-50">
                                                <td className="px-5 py-3 font-mono text-xs
                                                              text-gray-500">
                                                    {p.pass_number || '—'}
                                                </td>
                                                <td className="px-3 py-3 max-w-[140px] truncate"
                                                    title={p.reason}>{p.reason}</td>
                                                <td className="px-3 py-3">{p.going_place}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-xs">
    {formatTableDate(p.out_date)}<br/>{formatTime12h(p.out_time)}
</td>
<td className="px-3 py-3 whitespace-nowrap text-xs">
    {formatTableDate(p.return_date)}<br/>{formatTime12h(p.return_time)}
</td>
                                                <td className="px-3 py-3"><Badge status={p.status} /></td>

{/* ── Remarks column ────────────────────────────────── */}
<td className="px-3 py-3 max-w-[160px]">
    {p.remarks ? (
        <p
            className={`text-xs leading-snug truncate
                       ${p.status === 'Rejected'
                           ? 'text-red-600'
                           : p.status === 'Approved'
                               ? 'text-green-700'
                               : 'text-gray-600'}`}
            title={p.remarks}
        >
            {p.remarks}
        </p>
    ) : (
        <span className="text-xs text-gray-300">—</span>
    )}
</td>

<td className="px-3 py-3"><Badge status={p.exit_status} /></td>
                                                <td className="px-3 py-3">
                                                    {p.status === 'Approved' && (
                                                        <button
                                                            onClick={() => handleDownload(p.pass_id, p.pass_number)}
                                                            className="text-blue-700 hover:text-blue-900
                                                                      text-xs font-semibold"
                                                            title="Download PDF"
                                                        >
                                                            📄 PDF
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GatePasses;