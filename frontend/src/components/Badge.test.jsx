// src/components/Badge.test.jsx

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge component', () => {
    it('renders Approved status with green styling', () => {
        render(<Badge status="Approved" />);
        const badge = screen.getByText('Approved');
        expect(badge.className).toContain('bg-green-100');
    });

    it('renders Pending status with yellow styling', () => {
        render(<Badge status="Pending" />);
        const badge = screen.getByText('Pending');
        expect(badge.className).toContain('bg-yellow-100');
    });

    it('renders Rejected status with red styling', () => {
        render(<Badge status="Rejected" />);
        const badge = screen.getByText('Rejected');
        expect(badge.className).toContain('bg-red-100');
    });

    it('falls back to gray for unknown status', () => {
        render(<Badge status="Unknown" />);
        const badge = screen.getByText('Unknown');
        expect(badge.className).toContain('bg-gray-100');
    });
});