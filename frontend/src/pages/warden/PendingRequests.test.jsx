// src/pages/warden/PendingRequests.test.jsx

import { describe, it, expect } from 'vitest';
import { screen, waitFor, userEvent, renderWithProviders, loginAs } from '../../test/test-utils';
import PendingRequests from './PendingRequests';

describe('Warden PendingRequests page', () => {
    it('renders pending gate pass cards', async () => {
        loginAs('warden', 'WARDEN001');
        renderWithProviders(<PendingRequests />);

        await waitFor(() => {
            expect(screen.getByText(/test student/i)).toBeInTheDocument();
        });
    });

    it('opens approve modal and submits remarks', async () => {
        loginAs('warden', 'WARDEN001');
        const user = userEvent.setup();
        renderWithProviders(<PendingRequests />);

        await waitFor(() => {
            expect(screen.getByText(/approve/i)).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /approve/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/add a note/i)).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText(/add a note/i), 'Approved for festival leave');

        const confirmButtons = screen.getAllByRole('button', { name: /approve/i });
        await user.click(confirmButtons[confirmButtons.length - 1]);

        await waitFor(() => {
            expect(screen.getByText(/approved!/i)).toBeInTheDocument();
        });
    });
});