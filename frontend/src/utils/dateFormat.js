// src/utils/dateFormat.js

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Table format: "13-Jun-2026" ───────────────────────────
// Used for: table date columns
export function formatTableDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = MONTHS[d.getMonth()];
    const year  = d.getFullYear();
    return `${day}-${month}-${year}`;
}

// ── Dashboard format: "13 Jun 2026" ───────────────────────
// Used for: dashboard headers, summary text
export function formatDashboardDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = MONTHS[d.getMonth()];
    const year  = d.getFullYear();
    return `${day} ${month} ${year}`;
}

// ── Time only: "02:30 PM" ──────────────────────────────────
// Accepts either a "HH:MM:SS" time string or a full ISO datetime
export function formatTime12h(timeOrIso) {
    if (!timeOrIso) return '—';

    let hours, minutes;

    if (timeOrIso.includes('T') || timeOrIso.includes(' ')) {
        // Full datetime — extract local time
        const d = new Date(timeOrIso);
        hours   = d.getHours();
        minutes = d.getMinutes();
    } else {
        // Plain "HH:MM:SS" or "HH:MM" string
        const [h, m] = timeOrIso.split(':');
        hours   = parseInt(h, 10);
        minutes = parseInt(m, 10);
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMin  = String(minutes).padStart(2, '0');

    return `${displayHour}:${displayMin} ${ampm}`;
}

// ── Combined: "13 Jun 2026 02:30 PM" ───────────────────────
// Used for: gate pass "Out" / "Return" display, full timestamps
export function formatDateTime12h(dateStr, timeStr = null) {
    if (!dateStr) return '—';

    // If timeStr provided separately (date + time stored as separate fields)
    if (timeStr) {
        return `${formatDashboardDate(dateStr)} ${formatTime12h(timeStr)}`;
    }

    // Otherwise dateStr is a full ISO datetime — split date and time from it
    const d = new Date(dateStr);
    const datePart = formatDashboardDate(d);
    const timePart = formatTime12h(d.toISOString());
    return `${datePart} ${timePart}`;
}