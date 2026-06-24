// src/components/ActivityOverviewTable.jsx

// columns: [{ key, label, color }]
// stats: { today, week, month, overall } — each an object with the same keys
function ActivityOverviewTable({ columns, stats }) {
    const colorClasses = {
        blue:   'bg-blue-50 text-blue-700',
        green:  'bg-green-50 text-green-700',
        orange: 'bg-orange-50 text-orange-700',
        red:    'bg-red-50 text-red-700',
        purple: 'bg-purple-50 text-purple-700',
        yellow: 'bg-yellow-50 text-yellow-700',
    };

    const periods = [
        { label: 'Today',      data: stats.today },
        { label: 'This Week',  data: stats.week },
        { label: 'This Month', data: stats.month },
        { label: 'Overall',    data: stats.overall },
    ];

    return (
        <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Activity Overview</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 uppercase
                                       border-b border-gray-100">
                            <th className="px-5 py-3">Period</th>
                            {columns.map(c => (
                                <th key={c.key} className="px-3 py-3">{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {periods.map(({ label, data }) => (
                            <tr key={label} className="border-b border-gray-50
                                       last:border-b-0 hover:bg-gray-50">
                                <td className="px-5 py-3 font-semibold text-gray-800">{label}</td>
                                {columns.map(c => (
                                    <td key={c.key} className="px-3 py-3">
                                        <span className={`inline-flex items-center justify-center
                                                         min-w-[2.5rem] font-semibold rounded-lg
                                                         px-2 py-1 text-xs
                                                         ${colorClasses[c.color] || colorClasses.blue}`}>
                                            {data[c.key]}
                                        </span>
                                    </td>
                                ))}
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
    );
}

export default ActivityOverviewTable;