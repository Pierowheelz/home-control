/*!
 * Primary + optional alternate battery / signal pills for vent dashboard room cards.
 */
import React from "react";
import PropTypes from "prop-types";

import {
    toOptionalFiniteNumber,
    hasAlternateSensorBatterySignal,
    batteryToBarCount,
    signalToBarCount,
} from "components/Controllers/ventRoomBatterySignalUtils.js";
import {
    VentBatteryIcon,
    VentWifiSignalIcon,
} from "components/Controllers/VentRoomBatterySignalIcons.js";

/**
 * Renders battery + Wi‑Fi signal pills when `roomRow` is non-null; otherwise renders nothing.
 *
 * @param {{
 *   roomRow: import("components/Controllers/middleware/VentStateContext.js").VentRoomDashboardRow|null|undefined,
 * }} props
 * @returns {import("react").ReactNode}
 */
export default function VentRoomBatterySignalPills({ roomRow }) {
    if (roomRow == null) {
        return null;
    }

    const rawBattery = toOptionalFiniteNumber(roomRow.battery);
    const rawSignal = toOptionalFiniteNumber(roomRow.signal);
    const rawBatteryAlt = toOptionalFiniteNumber(roomRow.batteryAlt);
    const rawSignalAlt = toOptionalFiniteNumber(roomRow.signalAlt);
    const batteryBars = batteryToBarCount(rawBattery);
    const signalBars = signalToBarCount(rawSignal);
    const batteryBarsAlt = batteryToBarCount(rawBatteryAlt);
    const signalBarsAlt = signalToBarCount(rawSignalAlt);
    const showAltStatusPill = hasAlternateSensorBatterySignal(roomRow);
    const statusPillTitle = [
        rawBattery != null ? `Battery ${rawBattery}%` : "Battery —",
        rawSignal != null ? `Signal ${rawSignal}` : "Signal —",
    ].join(", ");
    const statusPillTitleAlt = [
        rawBatteryAlt != null
            ? `Battery (alternate) ${rawBatteryAlt}%`
            : "Battery (alternate) —",
        rawSignalAlt != null
            ? `Signal (alternate) ${rawSignalAlt}`
            : "Signal (alternate) —",
    ].join(", ");

    return (
        <div className="vent-card-status-pills">
            <div className="vent-card-status-pill" title={statusPillTitle}>
                <span className="sr-only">{statusPillTitle}</span>
                <VentBatteryIcon bars={batteryBars} />
                <VentWifiSignalIcon bars={signalBars} />
            </div>
            {showAltStatusPill ? (
                <div className="vent-card-status-pill" title={statusPillTitleAlt}>
                    <span className="sr-only">{statusPillTitleAlt}</span>
                    <VentBatteryIcon bars={batteryBarsAlt} />
                    <VentWifiSignalIcon bars={signalBarsAlt} />
                </div>
            ) : null}
        </div>
    );
}

VentRoomBatterySignalPills.propTypes = {
    /** Dashboard row; `null` renders nothing (e.g. motor tile before room data loads). */
    roomRow: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf([null])]),
};
