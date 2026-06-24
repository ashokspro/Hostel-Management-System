// src/pages/Login.test.jsx

import { describe, it, expect } from 'vitest';
import { screen, waitFor, userEvent, renderWithProviders } from '../test/test-utils';
import Login from './Login';

describe('Login page', () => {
    it('renders the login form', () => {
        renderWithProviders(<Login />);
        expect(screen.getByText(/smart hostel management/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter your id/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });

    it('shows an error banner on wrong credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByPlaceholderText(/enter your id/i), 'STU001');
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'WrongPassword123!');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
        const matches = screen.getAllByText(/invalid id or password/i);
        expect(matches.length).toBeGreaterThan(0);
    });
});

    it('shows validation message when fields are empty', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
        });
    });

    it('toggles password visibility', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        const passwordInput = screen.getByPlaceholderText(/enter your password/i);
        expect(passwordInput).toHaveAttribute('type', 'password');

        // The eye-icon toggle button is the only button without text near the password field
        const toggleButtons = screen.getAllByRole('button');
        const eyeToggle = toggleButtons.find(btn => btn.getAttribute('tabindex') === '-1');

        await user.click(eyeToggle);
        expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('logs in successfully with correct student credentials', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        await user.type(screen.getByPlaceholderText(/enter your id/i), 'STU001');
        await user.type(screen.getByPlaceholderText(/enter your password/i), 'Student@123');
        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(localStorage.getItem('hms_token')).toBe('mock-jwt-token');
            expect(localStorage.getItem('hms_user_type')).toBe('student');
        });
    });
});