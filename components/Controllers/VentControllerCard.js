/*!
 * Summary card for HVAC controller strip + recent vent action log (from dashboard context).
 */
import React from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardBody } from "reactstrap";

import { VentStateContext } from "components/Controllers/middleware/VentStateContext.js";

/**
 * Target setpoint display for the controller card (numeric + mode-dependent value).
 *
 * @param {string} mode
 * @param {{ coolTargetC?: number, heatTargetC?: number }|null} targets
 * @returns {{ main: string, hasValue: boolean }}
 */
function controllerTargetParts(mode, targets) {
    if (!targets) {
        return { main: "—", hasValue: false };
    }
    const cool = targets.coolTargetC;
    const heat = targets.heatTargetC;
    if (
        typeof cool !== "number" ||
        typeof heat !== "number" ||
        !Number.isFinite(cool) ||
        !Number.isFinite(heat)
    ) {
        return { main: "—", hasValue: false };
    }
    switch (mode) {
        case "cooling":
            return { main: cool.toFixed(1), hasValue: true };
        case "heating":
            return { main: heat.toFixed(1), hasValue: true };
        case "idle": {
            const mid = (heat + cool) / 2;
            return { main: mid.toFixed(1), hasValue: true };
        }
        default:
            return { main: "—", hasValue: false };
    }
}

/**
 * @param {string} mode
 * @returns {string}
 */
function formatModeLabel(mode) {
    if (typeof mode !== "string" || mode === "") {
        return "Unknown";
    }
    return mode.charAt(0).toUpperCase() + mode.slice(1);
}

/**
 * @param {import("components/Controllers/middleware/VentStateContext.js").VentDashboardStatistics|null} statistics
 * @returns {string}
 */
function formatAutomation24hStat(statistics) {
    if (
        statistics == null ||
        typeof statistics.automationActionsLast24h !== "number" ||
        !Number.isFinite(statistics.automationActionsLast24h)
    ) {
        return "—";
    }
    const n = statistics.automationActionsLast24h;
    const failed = statistics.failedActionsLast24h;
    if (typeof failed === "number" && failed > 0) {
        return `${n} (${failed} failed)`;
    }
    return `${n}`;
}

/**
 * @param {import("components/Controllers/middleware/VentStateContext.js").VentActionLogEntry} entry
 * @param {Record<string, object>|undefined|null} roomsByMotorId
 * @returns {string}
 */
function formatActionSummary(entry, roomsByMotorId) {
    const mid =
        entry.motorId !== undefined && entry.motorId !== null
            ? String(entry.motorId)
            : "";
    const row =
        mid !== "" && roomsByMotorId && typeof roomsByMotorId === "object"
            ? roomsByMotorId[mid]
            : null;
    const displayName =
        row && typeof row === "object" && row.displayName != null
            ? String(row.displayName).trim() || null
            : null;
    const roomKey =
        row && typeof row === "object" && row.room != null
            ? String(row.room).trim() || null
            : null;
    const rn =
        entry.roomName != null && String(entry.roomName).trim() !== ""
            ? String(entry.roomName).trim()
            : null;
    const motorLabel =
        displayName ||
        rn ||
        roomKey ||
        (mid !== "" ? `Motor ${mid}` : "—");

    const parts = [
        entry.source === "automation" ? "Auto" : "Manual",
        entry.action,
        motorLabel,
    ];
    if (entry.targetRaw != null && Number.isFinite(entry.targetRaw)) {
        parts.push(`${entry.targetRaw}%`);
    }
    if (rn != null && rn !== motorLabel) {
        parts.push(rn);
    }
    return parts.join(" · ");
}

/**
 * @param {import("components/Controllers/middleware/VentStateContext.js").VentFetchState|null} ventFetch
 * @returns {import("react").ReactNode}
 */
function VentControllerCardInner({ ventFetch }) {
    const controllerTempC = ventFetch?.controllerTempC;
    const hasCtrlTemp =
        controllerTempC != null &&
        typeof controllerTempC === "number" &&
        Number.isFinite(controllerTempC);
    const ctrlTempMain = hasCtrlTemp ? controllerTempC.toFixed(1) : null;

    const mode = ventFetch?.mode ?? "unknown";
    const targets = ventFetch?.targets ?? null;
    const modeLabel = formatModeLabel(mode);
    const { main: targetMain, hasValue: targetHasValue } = controllerTargetParts(
        mode,
        targets
    );
    const automationLine = formatAutomation24hStat(ventFetch?.statistics ?? null);
    const actions = Array.isArray(ventFetch?.actions) ? ventFetch.actions : [];
    const roomsByMotorId = ventFetch?.roomsByMotorId ?? null;

    return (
        <Card className="border-0 vent-controller-room-card d-flex flex-column">
            <CardHeader>
                <h2 className="h3 mb-0">Controller</h2>
            </CardHeader>
            <CardBody className="d-flex flex-column flex-grow-1 pt-3">
                <div className="vent-controller-card-metrics mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="vent-controller-metrics-left vent-card-metrics pr-2">
                            <div className="vent-temp-row d-flex align-items-baseline flex-wrap">
                                {hasCtrlTemp ? (
                                    <>
                                        <span className="vent-temp-value">
                                            {ctrlTempMain}
                                        </span>
                                        <span className="vent-temp-unit">°C</span>
                                    </>
                                ) : (
                                    <span className="vent-temp-value vent-temp-missing">
                                        —
                                    </span>
                                )}
                            </div>
                            <div className="vent-controller-mode mt-2 text-muted">
                                {modeLabel}
                            </div>
                        </div>
                        <div className="vent-controller-metrics-right text-right">
                            { targetHasValue && (mode === "cooling" || mode === "heating") ? (
                                <>
                                    <div className="vent-controller-target-value">
                                        {targetMain}°C
                                    </div>
                                    <div className="vent-controller-target-unit text-muted">
                                        TARGET
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="vent-controller-target-value vent-controller-target-missing">
                                        —
                                    </div>
                                    <div className="vent-controller-target-unit text-muted">
                                        TARGET
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div
                    className="vent-controller-actions small border rounded px-2 py-1 flex-grow-1"
                    style={{
                        maxHeight: "10rem",
                        overflowY: "scroll",
                        width: "100%",
                        minHeight: "6rem",
                        backgroundColor: "#464646",
                    }}
                >
                    {actions.length === 0 ? (
                        <div className="text-muted py-2">No actions recorded.</div>
                    ) : (
                        actions.map((entry) => {
                            const t = new Date(entry.at);
                            const timeStr = Number.isFinite(t.getTime())
                                ? t.toLocaleString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                  })
                                : "—";
                            const ok = entry.success !== false;
                            return (
                                <div
                                    key={entry.id}
                                    className="py-1 d-flex justify-content-between"
                                >
                                    <div className="text-break text-light">
                                        {formatActionSummary(
                                            entry,
                                            roomsByMotorId
                                        )}
                                    </div>
                                    <div className="d-flex justify-right">
                                        <span
                                            className={
                                                ok ? "text-success" : "text-danger"
                                            }
                                        >
                                            {ok ? "✓" : "✗"}
                                        </span>
                                        <span className="text-light ml-2 text-right flex-grow-1">
                                            {timeStr}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="vent-card-stamp vent-controller-automation-stamp text-muted small text-right mt-auto pt-3">
                    Automations (last 24hrs): {automationLine}
                </div>
            </CardBody>
        </Card>
    );
}

VentControllerCardInner.propTypes = {
    ventFetch: PropTypes.object,
};

VentControllerCardInner.defaultProps = {
    ventFetch: null,
};

export default class VentControllerCard extends React.Component {
    render() {
        return (
            <VentStateContext.Consumer>
                {(ventFetch) => (
                    <VentControllerCardInner ventFetch={ventFetch} />
                )}
            </VentStateContext.Consumer>
        );
    }
}
