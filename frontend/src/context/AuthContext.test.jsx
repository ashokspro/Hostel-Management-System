// src/context/AuthContext.test.jsx

import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import useAuth from '../hooks/useAuth';

function wrapper({ children }) {
    return (
        <BrowserRouter>
            <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
    );
}

describe('AuthContext', () => {
    it('starts with loading=true then resolves to logged-out state', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.user).toBeNull();
        expect(result.current.isLoggedIn()).toBe(false);
    });

    it('restores session from localStorage on mount', async () => {
        localStorage.setItem('hms_token', 'mock-jwt-token');
        localStorage.setItem('hms_user_type', 'student');
        localStorage.setItem('hms_user_id', 'STU001');

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.user).not.toBeNull();
        expect(result.current.user.id).toBe('STU001');
    });

    it('logout clears user and storage', async () => {
        localStorage.setItem('hms_token', 'mock-jwt-token');
        localStorage.setItem('hms_user_type', 'student');
        localStorage.setItem('hms_user_id', 'STU001');

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.logout());

        expect(result.current.user).toBeNull();
        expect(localStorage.getItem('hms_token')).toBeNull();
    });
});