// src/components/UserEditModal.jsx

import { useState, useEffect } from 'react';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// Fields editable per user_type
function getFieldsConfig(userType) {
    if (userType === 'student') {
        return [
            { name: 'name',           label: 'Name',           type: 'text' },
            { name: 'email',          label: 'Email',          type: 'email' },
            { name: 'phone',          label: 'Phone',          type: 'tel', pattern: '[0-9]{10}' },
            { name: 'room',           label: 'Room',           type: 'text' },
            { name: 'course',         label: 'Course',         type: 'text' },
            { name: 'year',           label: 'Year',           type: 'select', options: YEAR_OPTIONS },
            { name: 'guardian_name',  label: 'Guardian Name',  type: 'text' },
            { name: 'guardian_phone', label: 'Guardian Phone', type: 'tel', pattern: '[0-9]{10}' },
        ];
    }
    // warden, security, admin
    return [
        { name: 'name',              label: 'Name',              type: 'text' },
        { name: 'email',             label: 'Email',             type: 'email' },
        { name: 'phone',             label: 'Phone',             type: 'tel', pattern: '[0-9]{10}' },
        { name: 'role',              label: 'Role',              type: 'text' },
        { name: 'department',        label: 'Department',        type: 'text' },
        { name: 'emergency_contact', label: 'Emergency Contact', type: 'tel', pattern: '[0-9]{10}' },
    ];
}

function UserEditModal({ user, onSave, onClose, saving }) {
    const [form, setForm] = useState({});

    useEffect(() => {
        if (user) {
            const fields = getFieldsConfig(user.user_type);
            const initial = {};
            fields.forEach(f => { initial[f.name] = user[f.name] || (f.type === 'select' ? f.options[0] : ''); });
            setForm(initial);
        }
    }, [user]);

    if (!user) return null;

    const fields = getFieldsConfig(user.user_type);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handleSubmit(e) {
        e.preventDefault();
        onSave(form);
    }

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center
                        justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full
                            animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex
                                items-center justify-between">
                    <h3 className="text-base font-bold text-gray-800">
                        Edit {user.name}
                    </h3>
                    <button onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        {fields.map(f => (
                            <div key={f.name}>
                                <label className="block text-xs font-semibold text-gray-500
                                                  uppercase mb-1">{f.label}</label>
                                {f.type === 'select' ? (
                                    <select
                                        name={f.name}
                                        value={form[f.name] || ''}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                                  text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                                    >
                                        {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        name={f.name}
                                        type={f.type}
                                        pattern={f.pattern}
                                        maxLength={f.pattern ? 10 : undefined}
                                        title={f.pattern ? 'Must be exactly 10 digits' : undefined}
                                        value={form[f.name] || ''}
                                        onChange={handleChange}
                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                                  text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                            className="bg-blue-800 text-white text-sm font-semibold
                                      px-5 py-2 rounded-lg hover:bg-blue-900
                                      disabled:opacity-60 transition-colors">
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button type="button" onClick={onClose}
                            className="border-2 border-gray-200 text-gray-600 text-sm
                                      font-semibold px-5 py-2 rounded-lg hover:bg-gray-50
                                      transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserEditModal;