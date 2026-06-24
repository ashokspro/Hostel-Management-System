// src/test/test-utils.jsx

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '../context/AuthContext';

export function renderWithProviders(ui, { route = '/' } = {}) {
    window.history.pushState({}, 'Test page', route);

    return render(
        <BrowserRouter>
            <AuthProvider>
                {ui}
                <ToastContainer />
            </AuthProvider>
        </BrowserRouter>
    );
}

// Helper to log in a user before rendering protected pages
export function loginAs(userType, userId) {
    localStorage.setItem('hms_token', 'mock-jwt-token');
    localStorage.setItem('hms_user_type', userType);
    localStorage.setItem('hms_user_id', userId);
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';