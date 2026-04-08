/*!
 * SVG icons for vent room battery and Wi‑Fi signal bar display.
 */
import React from "react";
import PropTypes from "prop-types";

/**
 * Battery glyph with three vertical charge segments (filled count = `bars`).
 * Outline and active segments are white; inactive segments use dark grey.
 *
 * @param {{ bars: 0|1|2|3 }} props
 * @returns {import("react").ReactNode}
 */
export function VentBatteryIcon({ bars }) {
    const white = "#ffffff";
    const inactiveBar = "#495057";
    return (
        <svg
            className="vent-status-icon vent-battery-icon"
            width="26"
            height="14"
            viewBox="0 0 26 14"
            aria-hidden="true"
        >
            <rect
                x="0.5"
                y="2"
                width="19.5"
                height="10"
                rx="1.5"
                fill="none"
                stroke={white}
                strokeWidth="1"
            />
            <rect x="20.5" y="4.5" width="2.5" height="5" rx="0.5" fill={white} />
            {[0, 1, 2].map((i) => (
                <rect
                    key={i}
                    x={3.5 + i * 4.75}
                    y={4.5}
                    width="3.5"
                    height="6"
                    rx="0.45"
                    fill={i < bars ? white : inactiveBar}
                />
            ))}
        </svg>
    );
}

VentBatteryIcon.propTypes = {
    bars: PropTypes.oneOf([0, 1, 2, 3]).isRequired,
};

/**
 * Wi‑Fi signal: three elliptical arcs (Feather-style geometry) plus a bottom dot.
 * Arc index 0 = inner (weakest), 2 = outer (strongest). Active = white, inactive = light grey.
 *
 * @param {{ bars: 0|1|2|3 }} props
 * @returns {import("react").ReactNode}
 */
export function VentWifiSignalIcon({ bars }) {
    const inactive = "#495057";
    const active = "#ffffff";
    /** @param {0|1|2} arcIndex Inner (0) → outer (2). */
    const strokeAt = (arcIndex) => (arcIndex < bars ? active : inactive);
    return (
        <svg
            className="vent-status-icon vent-wifi-signal-icon"
            width="22"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            {/* Outer arc first (behind); inner arc last (on top). Paths from Feather “wifi”. */}
            <path
                d="M1.42 9a16 16 0 0 1 21.16 0"
                fill="none"
                stroke={strokeAt(2)}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M5 12.55a11 11 0 0 1 14.08 0"
                fill="none"
                stroke={strokeAt(1)}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.53 16.11a6 6 0 0 1 6.95 0"
                fill="none"
                stroke={strokeAt(0)}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="12"
                cy="20"
                r="1.25"
                fill={bars > 0 ? active : inactive}
            />
        </svg>
    );
}

VentWifiSignalIcon.propTypes = {
    bars: PropTypes.oneOf([0, 1, 2, 3]).isRequired,
};
