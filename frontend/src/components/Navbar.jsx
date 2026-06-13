// src/components/Navbar.jsx

import useAuth from '../hooks/useAuth';

// onMenuClick — toggles sidebar on mobile (used in Phase 4 responsive behavior)
function Navbar({ onMenuClick }) {
    const { user, logout, userType } = useAuth();

    const handleLogout = () => {
        logout();
        // Hard redirect ensures all state is wiped
        window.location.href = '/login';
    };

    // First letter of name for avatar circle
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center
                           justify-between px-4 md:px-6 sticky top-0 z-30">

            {/* ── Left: mobile menu button + title ──────── */}
            <div className="flex items-center gap-3">
                {/* Hamburger — only visible on small screens */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden text-gray-500 hover:text-blue-800 text-xl"
                >
                    ☰
                </button>
                <h2 className="text-lg font-semibold text-gray-800 capitalize">
                    {userType()} Portal
                </h2>
            </div>

            {/* ── Right: user pill + logout ─────────────── */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-full
                                px-3 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br
                                    from-blue-800 to-blue-500 flex items-center
                                    justify-center text-white text-xs font-bold">
                        {initial}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                        {user?.name || 'Loading...'}
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white text-sm font-semibold
                               px-3 py-1.5 rounded-lg hover:bg-red-600
                               transition-colors flex items-center gap-1.5"
                >
                    <span className="hidden sm:inline">Logout</span>
                    <span>🚪</span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;