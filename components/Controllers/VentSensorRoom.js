/*!
 * Read-only vent tile: room temperature / humidity from dashboard context rows
 * that have no motor (sensor-only locations).
 */
import React from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardBody } from "reactstrap";

import { formatRelativeTimeAgo } from "components/Controllers/middleware/ventRelativeTime.js";
import VentRoomBatterySignalPills from "components/Controllers/VentRoomBatterySignalPills.js";

/**
 * @param {import("components/Controllers/middleware/VentStateContext.js").VentRoomDashboardRow|null|undefined} roomRow
 * @returns {boolean}
 */
function hasDualRoomTempSensors(roomRow) {
    const primary = roomRow?.sensorPrimaryTemperatureC;
    const alt = roomRow?.sensorAltTemperatureC;
    return (
        typeof primary === "number" &&
        Number.isFinite(primary) &&
        typeof alt === "number" &&
        Number.isFinite(alt)
    );
}

/**
 * @param {import("components/Controllers/middleware/VentStateContext.js").VentRoomDashboardRow} roomRow
 * @returns {string}
 */
function resolveTitle(roomRow) {
    const r = roomRow?.room;
    if (typeof r === "string" && r.trim() !== "") {
        return r.trim();
    }
    return "Sensor";
}

/**
 * @param {import("components/Controllers/middleware/VentStateContext.js").VentRoomDashboardRow} roomRow
 * @returns {import("react").ReactNode}
 */
function VentSensorRoomCardInner({ roomRow }) {
    const title = resolveTitle(roomRow);
    const hasTemp =
        typeof roomRow.temperatureC === "number" &&
        Number.isFinite(roomRow.temperatureC);
    const tempMain = hasTemp ? roomRow.temperatureC.toFixed(1) : null;
    const hasHum =
        typeof roomRow.humidity === "number" &&
        Number.isFinite(roomRow.humidity);
    const humMain = hasHum ? `${Math.round(roomRow.humidity)}` : null;
    const showDualSensorStamp = hasDualRoomTempSensors(roomRow);
    const lastUpStr = formatRelativeTimeAgo(roomRow.lastUpdateMs);
    const src =
        typeof roomRow.temperatureSource === "string" &&
        roomRow.temperatureSource.trim() !== ""
            ? roomRow.temperatureSource.trim()
            : null;

    return (
        <Card className="border-0 vent-room-card vent-sensor-only-card h-100 d-flex flex-column">
            <VentRoomBatterySignalPills roomRow={roomRow} />
            <CardHeader>
                <h2 className="mb-0">{title}</h2>
                {src ? (
                    <div className="text-muted small text-uppercase mt-1">
                        {src}
                    </div>
                ) : null}
            </CardHeader>
            <CardBody className="d-flex flex-column flex-grow-1 pt-3 pb-3">
                <div className="vent-card-metrics mb-2">
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="vent-card-metrics-left pr-2">
                            <div className="vent-temp-row d-flex align-items-baseline flex-wrap">
                                {hasTemp ? (
                                    <>
                                        <span className="vent-temp-value">
                                            {tempMain}
                                        </span>
                                        <span className="vent-temp-unit">°C</span>
                                    </>
                                ) : (
                                    <span className="vent-temp-value vent-temp-missing">
                                        —
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="vent-card-metrics-right text-right">
                            {hasHum ? (
                                <>
                                    <div className="vent-humidity-value">
                                        {humMain}
                                    </div>
                                    <div className="vent-humidity-unit text-muted">
                                        % RH
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="vent-humidity-value vent-humidity-missing">
                                        —
                                    </div>
                                    <div className="vent-humidity-unit text-muted">
                                        % RH
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="vent-card-stamp text-muted small text-right mt-auto">
                    {showDualSensorStamp ? (
                        <>
                            <div>
                                Primary{" "}
                                {roomRow.sensorPrimaryTemperatureC.toFixed(1)} °C
                                {typeof roomRow.sensorPrimaryHumidity ===
                                    "number" &&
                                Number.isFinite(roomRow.sensorPrimaryHumidity)
                                    ? ` · ${Math.round(roomRow.sensorPrimaryHumidity)}% RH`
                                    : ""}{" "}
                                ·{" "}
                                {formatRelativeTimeAgo(
                                    roomRow.sensorPrimaryLastUpdateMs
                                )}
                            </div>
                            <div className="mt-1">
                                Alt {roomRow.sensorAltTemperatureC.toFixed(1)}{" "}
                                °C
                                {typeof roomRow.sensorAltHumidity === "number" &&
                                Number.isFinite(roomRow.sensorAltHumidity)
                                    ? ` · ${Math.round(roomRow.sensorAltHumidity)}% RH`
                                    : ""}{" "}
                                ·{" "}
                                {formatRelativeTimeAgo(
                                    roomRow.sensorAltLastUpdateMs
                                )}
                            </div>
                        </>
                    ) : (
                        lastUpStr
                    )}
                </div>
            </CardBody>
        </Card>
    );
}

VentSensorRoomCardInner.propTypes = {
    roomRow: PropTypes.object.isRequired,
};

export default VentSensorRoomCardInner;
