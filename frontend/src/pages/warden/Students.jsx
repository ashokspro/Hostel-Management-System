
// src/pages/warden/Students.jsx

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import wardenApi from '../../api/wardenApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import usePageTitle from '../../hooks/usePageTitle';


const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function Students() {
    const [students, setStudents] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [year,     setYear]     = useState('');

    // Detail modal
    const [selected, setSelected] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    usePageTitle('Students');
    useEffect(() => {
        load();
    }, []);

    async function load(filters = {}) {
        setLoading(true);
        try {
            const data = await wardenApi.getStudents(filters);
            setStudents(data);
        } catch {
            toast.error('Failed to load students.');
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        load({ search, year });
    }

    function clearFilters() {
        setSearch('');
        setYear('');
        load();
    }

    async function viewDetails(studentId) {
        setDetailLoading(true);
        setSelected({}); // open modal with loading state
        try {
            const data = await wardenApi.getStudent(studentId);
            setSelected(data);
        } catch {
            toast.error('Failed to load student details.');
            setSelected(null);
        } finally {
            setDetailLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold text-gray-800">🎓 Students</h1>

            {/* Search/filter */}
            <form onSubmit={handleSearch}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4
                          flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="🔍 Search by name, ID, or room..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] border-2 border-gray-200 rounded-lg
                              px-3 py-2 text-sm focus:border-blue-600 focus:outline-none
                              bg-gray-50"
                />
                <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm
                              focus:border-blue-600 focus:outline-none bg-gray-50"
                >
                    <option value="">All Years</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button type="submit"
                    className="bg-blue-800 text-white text-sm font-semibold px-4 py-2
                              rounded-lg hover:bg-blue-900 transition-colors">
                    Search
                </button>
                <button type="button" onClick={clearFilters}
                    className="text-xs text-gray-500 font-semibold hover:underline">
                    Clear
                </button>
            </form>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100
                            overflow-x-auto">
                {loading ? (
                    <LoadingSpinner />
                ) : students.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-3xl mb-2">🔍</p>
                        <p className="text-sm">No students found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase
                                           border-b border-gray-100">
                                <th className="px-5 py-3">ID</th>
                                <th className="px-3 py-3">Name</th>
                                <th className="px-3 py-3">Room</th>
                                <th className="px-3 py-3">Course</th>
                                <th className="px-3 py-3">Year</th>
                                <th className="px-3 py-3">Phone</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.id} className="border-b border-gray-50
                                           hover:bg-gray-50">
                                    <td className="px-5 py-3 font-mono text-xs">{s.id}</td>
                                    <td className="px-3 py-3 font-semibold text-gray-800">{s.name}</td>
                                    <td className="px-3 py-3">{s.room || '—'}</td>
                                    <td className="px-3 py-3">{s.course || '—'}</td>
                                    <td className="px-3 py-3">{s.year || '—'}</td>
                                    <td className="px-3 py-3">{s.phone || '—'}</td>
                                    <td className="px-3 py-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1
                                                         rounded-full
                                                         ${s.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-500'}`}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <button
                                            onClick={() => viewDetails(s.id)}
                                            className="text-blue-700 hover:text-blue-900
                                                      text-xs font-semibold"
                                        >
                                            👁️ View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                                justify-center p-4"
                    onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full
                                    animate-fadeInUp"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-gray-100 flex
                                        items-center justify-between">
                            <h3 className="text-base font-bold text-gray-800">Student Details</h3>
                            <button onClick={() => setSelected(null)}
                                className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                        </div>
                        <div className="p-5">
                            {detailLoading ? (
                                <LoadingSpinner />
                            ) : (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <Detail label="Student ID" value={selected.id} />
                                    <Detail label="Name" value={selected.name} />
                                    <Detail label="Room" value={selected.room || '—'} />
                                    <Detail label="Course" value={selected.course || '—'} />
                                    <Detail label="Year" value={selected.year || '—'} />
                                    <Detail label="Phone" value={selected.phone || '—'} />
                                    <Detail label="Email" value={selected.email || '—'} />
                                    <Detail label="Status" value={selected.is_active ? 'Active' : 'Inactive'} />
                                    <Detail label="Guardian" value={selected.guardian_name || '—'} />
                                    <Detail label="Guardian Phone" value={selected.guardian_phone || '—'} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Small helper component for the detail modal grid
function Detail({ label, value }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase
                          tracking-wide mb-1">{label}</p>
            <p className="font-medium text-gray-800">{value}</p>
        </div>
    );
}

export default Students;