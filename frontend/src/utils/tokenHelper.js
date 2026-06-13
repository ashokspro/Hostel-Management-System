// src/utils/tokenHelper.js

const TOKEN_KEY     = 'hms_token';
const USER_TYPE_KEY = 'hms_user_type';
const USER_ID_KEY   = 'hms_user_id';

const tokenHelper = {

    // ── Save everything after login ───────────────────────
    // Called once after successful login response
    save(accessToken, userType, userId) {
        localStorage.setItem(TOKEN_KEY,     accessToken);
        localStorage.setItem(USER_TYPE_KEY, userType);
        localStorage.setItem(USER_ID_KEY,   userId);
    },

    // ── Read individual values ────────────────────────────
    getToken()    { return localStorage.getItem(TOKEN_KEY);     },
    getUserType() { return localStorage.getItem(USER_TYPE_KEY); },
    getUserId()   { return localStorage.getItem(USER_ID_KEY);   },

    // ── Check if user is logged in ────────────────────────
    // A token existing means logged in — we trust JWT expiry for validity
    isLoggedIn()  { return !!localStorage.getItem(TOKEN_KEY);   },

    // ── Clear everything on logout ────────────────────────
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_TYPE_KEY);
        localStorage.removeItem(USER_ID_KEY);
    }
};

export default tokenHelper;