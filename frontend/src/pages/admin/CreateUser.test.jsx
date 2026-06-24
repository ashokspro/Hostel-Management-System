// src/pages/admin/CreateUser.test.jsx

import { describe, it, expect } from 'vitest';
import { screen, waitFor, userEvent, renderWithProviders, loginAs } from '../../test/test-utils';
import CreateUser from './CreateUser';

describe('Admin CreateUser page', () => {
    it('renders student fields by default', () => {
        loginAs('admin', 'ADMIN001');
        renderWithProviders(<CreateUser />);

        expect(screen.getByText(/student details/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/e.g. 101/i)).toBeInTheDocument(); // Room field
    });

    it('switches to staff fields when warden type selected', async () => {
        loginAs('admin', 'ADMIN001');
        const user = userEvent.setup();
        renderWithProviders(<CreateUser />);

        await user.click(screen.getByRole('button', { name: /warden/i }));

        expect(screen.getByText(/staff details/i)).toBeInTheDocument();
        expect(screen.queryByText(/student details/i)).not.toBeInTheDocument();
    });

    it('shows validation error for weak password', async () => {
        loginAs('admin', 'ADMIN001');
        const user = userEvent.setup();
        renderWithProviders(<CreateUser />);

        await user.type(screen.getByPlaceholderText(/e.g. 22cs001/i), 'TESTUSER1');
        await user.type(screen.getByPlaceholderText(/full name/i), 'Test User');
        await user.type(screen.getByPlaceholderText(/min 8 chars/i), 'weak');

        await user.click(screen.getByRole('button', { name: /create student/i }));

        await waitFor(() => {
            expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });
    });

    it('creates a student successfully with valid data', async () => {
        loginAs('admin', 'ADMIN001');
        const user = userEvent.setup();
        renderWithProviders(<CreateUser />);

        await user.type(screen.getByPlaceholderText(/e.g. 22cs001/i), 'TESTUSER1');
        await user.type(screen.getByPlaceholderText(/full name/i), 'Test User');
        await user.type(screen.getByPlaceholderText(/min 8 chars/i), 'Valid@Pass123');

        await user.click(screen.getByRole('button', { name: /create student/i }));

        await waitFor(() => {
            expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
        });
    });
});