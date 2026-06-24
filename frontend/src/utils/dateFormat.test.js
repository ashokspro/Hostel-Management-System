// src/utils/dateFormat.test.js

import { describe, it, expect } from 'vitest';
import { formatTableDate, formatDashboardDate, formatTime12h, formatDateTime12h } from './dateFormat';

describe('dateFormat utilities', () => {
    it('formats table date correctly', () => {
        expect(formatTableDate('2026-06-13')).toBe('13-Jun-2026');
    });

    it('returns placeholder for missing date', () => {
        expect(formatTableDate(null)).toBe('—');
        expect(formatTableDate(undefined)).toBe('—');
    });

    it('formats dashboard date correctly', () => {
        expect(formatDashboardDate('2026-06-13')).toBe('13 Jun 2026');
    });

    it('formats 24h time to 12h with AM/PM', () => {
        expect(formatTime12h('14:30:00')).toBe('2:30 PM');
        expect(formatTime12h('09:05:00')).toBe('9:05 AM');
        expect(formatTime12h('00:00:00')).toBe('12:00 AM');
        expect(formatTime12h('12:00:00')).toBe('12:00 PM');
    });

    it('formats combined date and time', () => {
        expect(formatDateTime12h('2026-06-13', '14:30:00')).toBe('13 Jun 2026 2:30 PM');
    });
});