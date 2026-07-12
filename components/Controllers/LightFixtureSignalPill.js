/*!
 * Zigbee link-quality pill for light fixture cards (signal only; no battery).
 */
import React from "react";
import PropTypes from "prop-types";

import {
    toOptionalFiniteNumber,
    signalToBarCount,
} from "components/Controllers/ventRoomBatterySignalUtils.js";
import { VentWifiSignalIcon } from "components/Controllers/VentRoomBatterySignalIcons.js";

/**
 * Renders a signal pill when `linkQuality` is available; otherwise nothing.
 *
 * @param {{ linkQuality: number|null|undefined }} props
 * @returns {import("react").ReactNode}
 */
export default function LightFixtureSignalPill({ linkQuality }) {
    const rawSignal = toOptionalFiniteNumber(linkQuality);
    if (rawSignal === null) {
        return null;
    }

    const signalBars = signalToBarCount(rawSignal);
    const statusPillTitle = `Signal ${rawSignal}`;

    return (
        <div className="vent-card-status-pills light-fixture-status-pills">
            <div className="vent-card-status-pill" title={statusPillTitle}>
                <span className="sr-only">{statusPillTitle}</span>
                <VentWifiSignalIcon bars={signalBars} />
            </div>
        </div>
    );
}

LightFixtureSignalPill.propTypes = {
    /** Zigbee LQI (~0–150); `null`/`undefined` hides the pill. */
    linkQuality: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([null]),
    ]),
};
