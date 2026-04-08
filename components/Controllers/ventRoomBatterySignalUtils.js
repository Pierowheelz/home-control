/*!
 * Bar counts and helpers for vent room battery / link-quality display on dashboard tiles.
 */

/** Upper bound used to normalize raw link quality onto the same 0–100 bar buckets as battery. */
export const VENT_SIGNAL_SCALE_MAX = 150;

/**
 * @param {unknown} value
 * @returns {number|null} Parsed finite number, or null.
 */
export function toOptionalFiniteNumber(value) {
    if (value == null || value === "") {
        return null;
    }
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * True when the room row includes alternate sensor `batteryAlt` and/or `signalAlt`.
 *
 * @param {{ batteryAlt?: unknown, signalAlt?: unknown }|null|undefined} roomRow
 * @returns {boolean}
 */
export function hasAlternateSensorBatterySignal(roomRow) {
    if (roomRow == null) {
        return false;
    }
    const b = toOptionalFiniteNumber(roomRow.batteryAlt);
    const s = toOptionalFiniteNumber(roomRow.signalAlt);
    return b !== null || s !== null;
}

/**
 * Maps a 0–100 percentage to 0–3 bars: [0,25)→0, [25,50)→1, [50,75)→2, [75,100]→3.
 *
 * @param {number} pct0to100
 * @returns {0|1|2|3}
 */
function pctToBarCount(pct0to100) {
    if (!Number.isFinite(pct0to100)) {
        return 0;
    }
    const p = Math.max(0, Math.min(100, pct0to100));
    if (p < 25) {
        return 0;
    }
    if (p < 50) {
        return 1;
    }
    if (p < 75) {
        return 2;
    }
    return 3;
}

/**
 * @param {unknown} battery0to100
 * @returns {0|1|2|3}
 */
export function batteryToBarCount(battery0to100) {
    const n = toOptionalFiniteNumber(battery0to100);
    if (n === null) {
        return 0;
    }
    return pctToBarCount(n);
}

/**
 * Maps raw link quality (about 0–{@link VENT_SIGNAL_SCALE_MAX}) to bar count via the same
 * percentage buckets as battery — **must not** pass the raw value into {@link pctToBarCount}
 * (e.g. raw 79 would wrongly imply ~79% signal).
 *
 * @param {unknown} rawSignal0to150Scale
 * @returns {0|1|2|3}
 */
export function signalToBarCount(rawSignal0to150Scale) {
    const raw = toOptionalFiniteNumber(rawSignal0to150Scale);
    if (raw === null) {
        return 0;
    }
    const pctOfFullScale = (raw / VENT_SIGNAL_SCALE_MAX) * 100;
    return pctToBarCount(pctOfFullScale);
}
