// src/pages/admin/CreateUser.jsx

import { useState } from 'react';
import { toast } from 'react-toastify';
import adminApi from '../../api/adminApi';
import usePageTitle from '../../hooks/usePageTitle';

const initialForm = {
    id: '',
    name: '',
    password: '',
    user_type: 'student',
    email: '',
    phone: '',
    // student fields
    room: '',
    course: '',
    year: '1st Year',
    guardian_name: '',
    guardian_phone: '',
    // staff fields
    role: '',
    department: '',
    emergency_contact: '',
};

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function CreateUser() {
    const [form, setForm] = useState(initialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    usePageTitle('Create User');
    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function resetForm() {
        setForm(initialForm);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);

        // Build payload — only include relevant fields per user_type
        const payload = {
            id: form.id.trim(),
            name: form.name.trim(),
            password: form.password,
            user_type: form.user_type,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
        };

        if (form.user_type === 'student') {
            payload.room           = form.room.trim() || null;
            payload.course         = form.course.trim() || null;
            payload.year           = form.year;
            payload.guardian_name  = form.guardian_name.trim() || null;
            payload.guardian_phone = form.guardian_phone.trim() || null;
        } else {
            // warden, security, admin
            payload.role              = form.role.trim() || null;
            payload.department        = form.department.trim() || null;
            payload.emergency_contact = form.emergency_contact.trim() || null;
        }

        try {
            await adminApi.createUser(payload);
            toast.success(`${form.user_type.charAt(0).toUpperCase() + form.user_type.slice(1)} "${form.id}" created successfully!`);
            resetForm();
        } catch (err) {
            // Pydantic validation errors come as an array in err.response.data.detail
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Show the first validation error message
                toast.error(detail[0]?.msg || 'Validation failed.');
            } else {
                toast.error(detail || 'Failed to create user.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    const isStudent = form.user_type === 'student';

    return (
        <div className="max-w-3xl">
            <h1 className="text-xl font-bold text-gray-800 mb-1">➕ Create New User</h1>
            <p className="text-sm text-gray-500 mb-5">
                Add a student, warden, security staff, or admin account.
            </p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* User type */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500
                                          uppercase mb-1.5">User Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['student', 'warden', 'security', 'admin'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setForm({ ...initialForm, user_type: type })}
                                    className={`text-sm font-semibold py-2.5 rounded-lg
                                              border-2 transition-colors capitalize
                                              ${form.user_type === type
                                                  ? 'bg-blue-800 text-white border-blue-800'
                                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Common fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500
                                              uppercase mb-1.5">User ID *</label>
                            <input
                                name="id" required value={form.id} onChange={handleChange}
                                placeholder={isStudent ? 'e.g. 22CS001' : 'e.g. WARDEN002'}
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                          text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500
                                              uppercase mb-1.5">Full Name *</label>
                            <input
                                name="name" required value={form.name} onChange={handleChange}
                                placeholder="Full name"
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                          text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500
                                          uppercase mb-1.5">Password *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password" required minLength={8}
                                value={form.password} onChange={handleChange}
                                placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                          pr-10 text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                            />
                            <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2
                                              text-gray-400 hover:text-gray-600
                                              transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        // Eye-off icon (SVG)
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        // Eye icon (SVG)
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>       
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Must include uppercase, lowercase, number, and special character.
                        </p>
                    </div>

                    {/* Email / Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500
                                              uppercase mb-1.5">Email</label>
                            <input
                                type="email" name="email" value={form.email} onChange={handleChange}
                                placeholder="email@example.com"
                                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                          text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500
                                              uppercase mb-1.5">Phone</label>
                            <input
    name="phone" value={form.phone} onChange={handleChange}
    placeholder="10-digit number"
    pattern="[0-9]{10}"
    title="Phone must be exactly 10 digits"
    maxLength={10}
    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
              text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
/>
                        </div>
                    </div>

                    {/* ── Conditional fields ──────────────────── */}
                    {isStudent ? (
                        <>
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">
                                    Student Details
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500
                                                          uppercase mb-1.5">Room</label>
                                        <input
                                            name="room" value={form.room} onChange={handleChange}
                                            placeholder="e.g. 101"
                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                                      text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500
                                                          uppercase mb-1.5">Course</label>
                                        <input
                                            name="course" value={form.course} onChange={handleChange}
                                            placeholder="e.g. Computer Science"
                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                                      text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500
                                                          uppercase mb-1.5">Year</label>
                                        <select
                                            name="year" value={form.year} onChange={handleChange}
                                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                                      text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                                        >
                                            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500
                                                      uppercase mb-1.5">Guardian Name</label>
                                    <input
                                        name="guardian_name" value={form.guardian_name} onChange={handleChange}
                                        placeholder="Parent/Guardian name"
                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                                  text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500
                                                      uppercase mb-1.5">Guardian Phone</label>
                                    <input
    name="guardian_phone" value={form.guardian_phone} onChange={handleChange}
    placeholder="10-digit number"
    pattern="[0-9]{10}" maxLength={10}
    title="Phone must be exactly 10 digits"
    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
              text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
/>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-3">
                                Staff Details
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500
                                                      uppercase mb-1.5">Role / Designation</label>
                                    <input
                                        name="role" value={form.role} onChange={handleChange}
                                        placeholder="e.g. Night Guard"
                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                                  text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500
                                                      uppercase mb-1.5">Department</label>
                                    <input
                                        name="department" value={form.department} onChange={handleChange}
                                        placeholder="e.g. Hostel Block A"
                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
                                                  text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500
                                                      uppercase mb-1.5">Emergency Contact</label>
                                    <input
    name="emergency_contact" value={form.emergency_contact} onChange={handleChange}
    placeholder="10-digit number"
    pattern="[0-9]{10}" maxLength={10}
    title="Phone must be exactly 10 digits"
    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2
              text-sm focus:border-blue-600 focus:outline-none bg-gray-50"
/>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit" disabled={submitting}
                            className="bg-blue-800 text-white text-sm font-semibold
                                      px-6 py-2.5 rounded-lg hover:bg-blue-900
                                      disabled:opacity-60 transition-colors"
                        >
                            {submitting ? 'Creating...' : `➕ Create ${form.user_type.charAt(0).toUpperCase() + form.user_type.slice(1)}`}
                        </button>
                        <button
                            type="button" onClick={resetForm}
                            className="border-2 border-gray-200 text-gray-600 text-sm
                                      font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50
                                      transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateUser;