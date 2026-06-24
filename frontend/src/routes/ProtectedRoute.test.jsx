// src/routes/ProtectedRoute.test.jsx

import { describe, it, expect } from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { screen, waitFor, renderWithProviders, loginAs } from '../test/test-utils';
import ProtectedRoute from './ProtectedRoute';

function DummyPage() {
    return <div>Protected Content</div>;
}

function LoginStub() {
    return <div>Login Page Stub</div>;
}

function UnauthorizedStub() {
    return <div>Unauthorized Stub</div>;
}

// Wrap ProtectedRoute in actual <Routes> so Navigate/useLocation resolve correctly
function renderProtected(allowedRoles, route = '/student/dashboard') {
    return renderWithProviders(
        <Routes>
            <Route path="/login" element={<LoginStub />} />
            <Route path="/unauthorized" element={<UnauthorizedStub />} />
            <Route
                path="/student/dashboard"
                element={
                    <ProtectedRoute allowedRoles={allowedRoles}>
                        <DummyPage />
                    </ProtectedRoute>
                }
            />
        </Routes>,
        { route }
    );
}

describe('ProtectedRoute', () => {
    it('redirects to login when not authenticated', async () => {
        renderProtected(['student']);

        await waitFor(() => {
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
            expect(screen.getByText('Login Page Stub')).toBeInTheDocument();
        });
    });

    it('renders children when authenticated with correct role', async () => {
        loginAs('student', 'STU001');

        renderProtected(['student']);

        await waitFor(() => {
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });
    });

    it('blocks access when role does not match', async () => {
        loginAs('student', 'STU001');

        renderProtected(['warden']);

        await waitFor(() => {
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
            expect(screen.getByText('Unauthorized Stub')).toBeInTheDocument();
        });
    });
});