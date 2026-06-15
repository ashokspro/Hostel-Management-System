// src/components/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// ── Link configs per role ─────────────────────────────────
// Each entry: { label, path, icon }
// Keeping this as data (not JSX) makes it easy to scan and edit
const navConfig = {
    student: [
        { label: 'Dashboard',    path: '/student/dashboard',  icon: '🏠' },
        { label: 'My Profile',   path: '/student/profile',    icon: '👤' },
        { label: 'Gate Passes',  path: '/student/gatepasses', icon: '🪪' },
    ],
    warden: [
        { label: 'Dashboard',        path: '/warden/dashboard',        icon: '🏠' },
        { label: 'Pending Requests', path: '/warden/pending',          icon: '⏳' },
        { label: 'All Gate Passes',  path: '/warden/gatepasses',       icon: '📋' },
        { label: 'Students',         path: '/warden/students',         icon: '🎓' },
    ],
    security: [
    { label: 'Dashboard',       path: '/security/dashboard',  icon: '🏠' },
    { label: 'Approved Passes', path: '/security/approved',   icon: '✅' },
    { label: 'Currently Out',   path: '/security/out',        icon: '🚶' },
    { label: 'History',         path: '/security/history',    icon: '📜' },
],
    admin: [
    { label: 'Dashboard',  path: '/admin/dashboard', icon: '🏠' },
    { label: 'Students',   path: '/admin/students',  icon: '🎓' },
    { label: 'Wardens',    path: '/admin/wardens',   icon: '🛡️' },
    { label: 'Security',   path: '/admin/security',  icon: '👮' },
    { label: 'Admins',     path: '/admin/admins',    icon: '⚙️' },
    { label: 'Create User',path: '/admin/create',    icon: '➕' },
],
};

// isOpen / onClose — control mobile slide-in behavior
function Sidebar({ isOpen, onClose }) {
    const { userType } = useAuth();
    const links = navConfig[userType()] || [];

    return (
        <>
            {/* ── Mobile overlay ─────────────────────────── */}
            {/* Dark backdrop behind sidebar on mobile — clicking it closes sidebar */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                />
            )}

            {/* ── Sidebar itself ─────────────────────────── */}
            <aside className={`
                fixed md:static top-0 left-0 h-full md:h-auto
                w-64 bg-blue-900 text-white z-50
                transform transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                flex flex-col
            `}>
                {/* Logo / brand */}
                <div className="h-16 flex items-center gap-3 px-5 border-b
                                border-blue-800 flex-shrink-0">
                    <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center
                                    justify-center text-lg">🛡️</div>
                    <div>
                        <h1 className="text-sm font-bold leading-tight">Hostel MS</h1>
                        <p className="text-[11px] text-blue-300">Gate Pass System</p>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {links.map(link => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            // Close sidebar on mobile after clicking a link
                            onClick={onClose}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-lg
                                text-sm font-medium transition-colors
                                ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'}
                            `}
                        >
                            <span className="text-lg">{link.icon}</span>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-blue-800 flex-shrink-0">
                    <p className="text-[11px] text-blue-300 text-center">
                        © 2026 Hostel Management
                    </p>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;

