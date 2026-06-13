// src/context/AuthContext.jsx

import { createContext, useState, useEffect, useCallback } from 'react';
import tokenHelper from '../utils/tokenHelper';
import axiosInstance from '../api/axiosInstance';

// Step 1 — Create the context object
// This is what other components will import and consume
export const AuthContext = createContext(null);

// Step 2 — Create the Provider component
// This wraps your entire app and makes auth state available everywhere
export function AuthProvider({ children }) {

    // ── State ─────────────────────────────────────────────
    // user — the full profile object fetched from backend
    // loading — true while we're checking if user is still logged in
    const [user,    setUser]    = useState(null);
    const [loading, setLoading] = useState(true);


    // ── Fetch current user profile ────────────────────────
    // Called on app startup to restore session from localStorage token
    // Also called after login to get full user details
    const fetchCurrentUser = useCallback(async () => {
    try {
        const res = await axiosInstance.get('/api/auth/me');
        return res.data;
    } catch {
        tokenHelper.clear();
        return null;
    }
}, []);


    // ── On app startup — restore session ─────────────────
    // When the page refreshes, localStorage still has the token
    // We use it to re-fetch the user profile and restore state
    useEffect(() => {
        const restoreSession = async () => {
            if (tokenHelper.isLoggedIn()) {
                const userData = await fetchCurrentUser();
                setUser(userData);
            }
            // loading = false means "we've checked, render the app now"
            setLoading(false);
        };

        restoreSession();
    }, [fetchCurrentUser]);


    // ── Login ─────────────────────────────────────────────
    // Called by the Login page after successful API response
    // Saves token, then fetches full profile
    const login = async (loginResponse) => {
        // loginResponse = { access_token, token_type, user_type, id }
        tokenHelper.save(
            loginResponse.access_token,
            loginResponse.user_type,
            loginResponse.id
        );

        // Fetch and store the full user profile
        const userData = await fetchCurrentUser();
        setUser(userData);

        return loginResponse.user_type; // returned so Login page can redirect
    };


    // ── Logout ────────────────────────────────────────────
    const logout = () => {
        tokenHelper.clear();
        setUser(null);
    };


    // ── Value exposed to all consumers ────────────────────
    // Any component that calls useAuth() gets these
    const value = {
        user,           // full profile object { id, name, user_type, ... }
        loading,        // boolean — true while restoring session
        login,          // function — call after login API success
        logout,         // function — call on logout button
        isLoggedIn: tokenHelper.isLoggedIn,
        userType:   tokenHelper.getUserType,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}