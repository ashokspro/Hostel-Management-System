// src/components/StatCard.jsx

// color — tailwind color name: 'blue' | 'green' | 'yellow' | 'red'
const colorStyles = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red:    'bg-red-50 text-red-700 border-red-200',
};

function StatCard({ icon, label, value, color = 'blue' }) {
    return (
        <div className={`rounded-xl border-2 p-4 flex items-center gap-4
                         ${colorStyles[color]}`}>
            <div className="text-3xl">{icon}</div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs font-medium opacity-75">{label}</p>
            </div>
        </div>
    );
}

export default StatCard;