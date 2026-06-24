// src/utils/errorHelper.test.js

import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from './errorHelper';

describe('extractErrorMessage', () => {
    it('extracts string detail from FastAPI HTTPException', () => {
        const err = { response: { data: { detail: 'Invalid credentials' } } };
        expect(extractErrorMessage(err)).toBe('Invalid credentials');
    });

    it('extracts first message from Pydantic validation array', () => {
        const err = {
            response: {
                data: { detail: [{ msg: 'Password too short' }, { msg: 'Phone invalid' }] }
            }
        };
        expect(extractErrorMessage(err)).toBe('Password too short');
    });

    it('returns network error message when no response exists', () => {
        const err = { request: {} };
        expect(extractErrorMessage(err)).toBe('Cannot connect to server.');
    });

    it('returns fallback when detail is missing entirely', () => {
        const err = { response: { data: {} } };
        expect(extractErrorMessage(err, 'Custom fallback')).toBe('Custom fallback');
    });
});