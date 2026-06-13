// src/components/Badge.jsx

// Maps status text → Tailwind color classes
const statusStyles = {
    Pending:  'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    In:       'bg-green-100 text-green-800',
    Out:      'bg-orange-100 text-orange-800',
};

function Badge({ status }) {
    const style = statusStyles[status] || 'bg-gray-100 text-gray-700';

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                          text-xs font-semibold ${style}`}>
            {status}
        </span>
    );
}

export default Badge;