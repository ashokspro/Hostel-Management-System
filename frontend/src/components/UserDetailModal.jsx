// src/components/UserDetailModal.jsx

import LoadingSpinner from './LoadingSpinner';

// Fields shown per user_type
const fieldsByType = {
    student: [
        ['id', 'Student ID'], ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'],
        ['room', 'Room'], ['course', 'Course'], ['year', 'Year'],
        ['guardian_name', 'Guardian Name'], ['guardian_phone', 'Guardian Phone'],
    ],
    warden: [
        ['id', 'Warden ID'], ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'],
        ['role', 'Role'], ['department', 'Department'], ['emergency_contact', 'Emergency Contact'],
    ],
    security: [
        ['id', 'Security ID'], ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'],
        ['role', 'Role'], ['department', 'Department'], ['emergency_contact', 'Emergency Contact'],
    ],
    admin: [
        ['id', 'Admin ID'], ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'],
        ['role', 'Role'], ['department', 'Department'], ['emergency_contact', 'Emergency Contact'],
    ],
};

function UserDetailModal({ user, loading, onClose }) {
    if (!user) return null;

    const fields = fieldsByType[user.user_type] || fieldsByType.student;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                        justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full
                            animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex
                                items-center justify-between">
                    <h3 className="text-base font-bold text-gray-800">
                        {Object.keys(user).length > 1 ? user.name : 'Loading...'}
                    </h3>
                    <button onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                </div>
                <div className="p-5">
                    {loading || Object.keys(user).length <= 1 ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {fields.map(([key, label]) => (
                                    <div key={key}>
                                        <p className="text-xs font-semibold text-gray-400
                                                      uppercase tracking-wide mb-1">{label}</p>
                                        <p className="font-medium text-gray-800">
                                            {user[key] || '—'}
                                        </p>
                                    </div>
                                ))}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400
                                                  uppercase tracking-wide mb-1">Status</p>
                                    <span className={`text-xs font-semibold px-2.5 py-1
                                                     rounded-full
                                                     ${user.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-500'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400
                                                  uppercase tracking-wide mb-1">Joined</p>
                                    <p className="font-medium text-gray-800">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserDetailModal;