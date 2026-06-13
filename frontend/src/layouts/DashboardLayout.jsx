// src/layouts/DashboardLayout.jsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';

function DashboardLayout() {
    // Controls sidebar visibility on mobile
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* Sidebar — fixed on mobile, static on desktop */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main content column */}
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />

                {/* Page content renders here via nested routes */}
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;