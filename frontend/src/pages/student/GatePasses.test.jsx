// src/pages/student/GatePasses.test.jsx

import { describe, it, expect } from 'vitest';
import { screen, waitFor, userEvent, renderWithProviders, loginAs } from '../../test/test-utils';
import GatePasses from './GatePasses';

describe('Student GatePasses page', () => {
    it('renders the create form and history table', async () => {
        loginAs('student', 'STU001');
        renderWithProviders(<GatePasses />);

        expect(screen.getByText(/request new gate pass/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/going home/i)).toBeInTheDocument();
        });
    });

    it('blocks submission when return time is before out time', async () => {
        loginAs('student', 'STU001');
        const user = userEvent.setup();
        renderWithProviders(<GatePasses />);

        await user.type(screen.getByPlaceholderText(/why are you going out/i), 'Test reason');
        await user.type(screen.getByPlaceholderText(/destination/i), 'Chennai');

        const outDateInput    = screen.getByLabelText ? null : document.querySelector('input[name="out_date"]') || null;

        // Fallback: query by surrounding label text via container
        const dateInputs = document.querySelectorAll('input[type="date"]');
        const timeInputs = document.querySelectorAll('input[type="time"]');

        await user.type(dateInputs[0], '2026-06-20'); // out_date
        await user.type(timeInputs[0], '14:00');      // out_time
        await user.type(dateInputs[1], '2026-06-20'); // return_date
        await user.type(timeInputs[1], '10:00');      // return_time — earlier than out_time

        await user.click(screen.getByRole('button', { name: /submit request/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/return date\/time must be after/i)
            ).toBeInTheDocument();
        });
    });
});