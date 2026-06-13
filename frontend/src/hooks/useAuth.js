// src/hooks/useAuth.js

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Custom hook — wraps useContext with a safety check
// If someone calls useAuth() outside of AuthProvider,
// they get a clear error instead of a confusing crash
function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth() must be used inside an <AuthProvider>. ' +
            'Make sure AuthProvider wraps your App in main.jsx.'
        );
    }

    return context;
}

export default useAuth;