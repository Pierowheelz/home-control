/**
 * Formats an epoch timestamp as a short English "time ago" string for sensor freshness.
 *
 * @param {number|null|undefined} epochMs
 * @returns {string}
 */
export function formatRelativeTimeAgo(epochMs) {
    if (epochMs == null || !Number.isFinite(epochMs)) {
        return "—";
    }
    const sec = Math.max(0, Math.floor((Date.now() - epochMs) / 1000));
    if (sec < 5) {
        return "just now";
    }
    if (sec < 60) {
        return `${sec}s ago`;
    }
    const min = Math.floor(sec / 60);
    if (min < 60) {
        return `${min} min ago`;
    }
    const hr = Math.floor(min / 60);
    if (hr < 24) {
        return `${hr}h ago`;
    }
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
}

/**
 * Compact human-readable time remaining until a future epoch (e.g. override expiry).
 *
 * @param {number|null|undefined} untilMs
 * @returns {string} Empty string when not applicable.
 */
export function formatTimeRemainingUntil(untilMs) {
    if (untilMs == null || !Number.isFinite(untilMs)) {
        return "";
    }
    const sec = Math.floor((untilMs - Date.now()) / 1000);
    if (sec <= 0) {
        return "ending soon";
    }
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) {
        return `${h}h ${m}m`;
    }
    if (m > 0) {
        return `${m} min`;
    }
    return "<1 min";
}
