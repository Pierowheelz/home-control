/*!
 * Summary card for HVAC controller strip + recent vent action log (from dashboard context).
 */
import React, { Component } from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/pro-solid-svg-icons";

import WbSession from "classes/Session.jsx";
import { VentStateContext } from "components/Controllers/middleware/VentStateContext.js";
import {
    formatRelativeTimeAgo,
    formatTimeRemainingUntil,
} from "components/Controllers/middleware/ventRelativeTime.js";

/** Default HVAC mode override duration (1 hour, ms). */
const HVAC_MODE_DEFAULT_DURATION_MS = 60 * 60 * 1000;

/**
 * Preset durations for the HVAC mode modal (label + duration in ms).
 *
 * @type {readonly { label: string, ms: number }[]}
 */
const HVAC_MODE_DURATION_OPTIONS = [
    { label: "5 minutes", ms: 5 * 60 * 1000 },
    { label: "15 minutes", ms: 15 * 60 * 1000 },
    { label: "1 hr", ms: HVAC_MODE_DEFAULT_DURATION_MS },
    { label: "4hrs", ms: 4 * 60 * 60 * 1000 },
    { label: "6hrs", ms: 6 * 60 * 60 * 1000 },
    { label: "8hrs", ms: 8 * 60 * 60 * 1000 },
    { label: "12hrs", ms: 12 * 60 * 60 * 1000 },
    { label: "20hrs", ms: 20 * 60 * 60 * 1000 },
];

/**
 * True when dashboard reports an unexpired HVAC mode override.
 *
 * @param {'cooling'|'heating'|null|undefined} override
 * @param {number|null|undefined} untilMs
 * @returns {boolean}
 */
function hasActiveHvacModeOverride(override, untilMs) {
    if (override !== "cooling" && override !== "heating") {
        return false;
    }
    if (typeof untilMs !== "number" || !Number.isFinite(untilMs)) {
        return false;
    }
    return Date.now() < untilMs;
}

/**
 * @param {'cooling'|'heating'|null|undefined} override
 * @param {string} mode
 * @returns {'cooling'|'heating'}
 */
function initialHvacModeDraft(override, mode) {
    if (override === "cooling" || override === "heating") {
        return override;
    }
    if (mode === "cooling" || mode === "heating") {
        return mode;
    }
    return "cooling";
}

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
 * Render the HVAC instantaneous power reading as "88.3 W" (one decimal place).
 * Returns `"—"` when the value is missing or not finite.
 *
 * @param {number|null|undefined} powerW
 * @returns {string}
 */
function formatPowerW(powerW) {
    if (typeof powerW !== "number" || !Number.isFinite(powerW)) {
        return "—";
    }
    return `${powerW.toFixed(1)} W`;
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

class VentControllerCard extends Component {
    static contextType = WbSession;

    state = {
        hvacModeModalOpen: false,
        /** @type {'cooling'|'heating'} */
        hvacModeDraft: "cooling",
        hvacModeDurationMs: HVAC_MODE_DEFAULT_DURATION_MS,
        /** True if an override was active when the modal opened (controls Reset / Update labels). */
        hvacModeHadOverrideAtOpen: false,
        hvacModeBusy: false,
        hvacModeErrorMsg: "",
    };

    /** @type {ReturnType<typeof setInterval> | null} */
    relativeTimeTimer = null;

    componentDidMount() {
        if (typeof window !== "undefined") {
            this.relativeTimeTimer = setInterval(() => this.forceUpdate(), 10000);
        }
    }

    componentWillUnmount() {
        if (this.relativeTimeTimer !== null) {
            clearInterval(this.relativeTimeTimer);
            this.relativeTimeTimer = null;
        }
    }

    /**
     * @param {import("components/Controllers/middleware/VentStateContext.js").VentFetchState|null} ventFetch
     * @returns {void}
     */
    openHvacModeModal = (ventFetch) => {
        const override = ventFetch?.hvacModeOverride ?? null;
        const untilMs = ventFetch?.hvacModeOverrideUntilMs ?? null;
        const mode = ventFetch?.mode ?? "unknown";
        const hadOverride = hasActiveHvacModeOverride(override, untilMs);
        this.setState({
            hvacModeModalOpen: true,
            hvacModeDraft: initialHvacModeDraft(
                hadOverride ? override : null,
                mode
            ),
            hvacModeDurationMs: HVAC_MODE_DEFAULT_DURATION_MS,
            hvacModeHadOverrideAtOpen: hadOverride,
            hvacModeErrorMsg: "",
            hvacModeBusy: false,
        });
    };

    /**
     * @returns {void}
     */
    closeHvacModeModal = () => {
        this.setState({
            hvacModeModalOpen: false,
            hvacModeErrorMsg: "",
            hvacModeBusy: false,
        });
    };

    /**
     * Applies the selected HVAC mode override.
     *
     * @returns {Promise<boolean>} True when the server accepted the setpoint.
     */
    applyHvacMode = async () => {
        const { hvacModeDraft, hvacModeDurationMs } = this.state;
        this.setState({ hvacModeBusy: true, hvacModeErrorMsg: "" });
        const res = await this.context.setVentHvacMode(
            hvacModeDraft,
            hvacModeDurationMs
        );
        if (res === false) {
            this.setState({
                hvacModeBusy: false,
                hvacModeErrorMsg:
                    "Request failed. Check your connection and try again.",
            });
            return false;
        }
        const ok = (res.success ?? false) === true && (res.error ?? "") === "";
        if (!ok) {
            const err =
                typeof res.error === "string" && res.error !== ""
                    ? res.error
                    : "Could not set HVAC mode.";
            this.setState({ hvacModeBusy: false, hvacModeErrorMsg: err });
            return false;
        }
        this.setState({
            hvacModeBusy: false,
            hvacModeModalOpen: false,
            hvacModeErrorMsg: "",
        });
        return true;
    };

    /**
     * Clears the temporary HVAC mode override.
     *
     * @returns {Promise<boolean>} True when the server accepted the cancel request.
     */
    resetHvacModeOverride = async () => {
        this.setState({ hvacModeBusy: true, hvacModeErrorMsg: "" });
        const res = await this.context.cancelVentHvacMode();
        if (res === false) {
            this.setState({
                hvacModeBusy: false,
                hvacModeErrorMsg:
                    "Request failed. Check your connection and try again.",
            });
            return false;
        }
        const ok = (res.success ?? false) === true && (res.error ?? "") === "";
        if (!ok) {
            const err =
                typeof res.error === "string" && res.error !== ""
                    ? res.error
                    : "Could not reset HVAC mode.";
            this.setState({ hvacModeBusy: false, hvacModeErrorMsg: err });
            return false;
        }
        this.setState({
            hvacModeBusy: false,
            hvacModeModalOpen: false,
            hvacModeErrorMsg: "",
        });
        return true;
    };

    /**
     * @param {import("components/Controllers/middleware/VentStateContext.js").VentFetchState|null} ventFetch
     * @returns {import("react").ReactNode}
     */
    renderCard(ventFetch) {
        const controllerTempC = ventFetch?.controllerTempC;
        const hasCtrlTemp =
            controllerTempC != null &&
            typeof controllerTempC === "number" &&
            Number.isFinite(controllerTempC);
        const ctrlTempMain = hasCtrlTemp ? controllerTempC.toFixed(1) : null;

        const mode = ventFetch?.mode ?? "unknown";
        const targets = ventFetch?.targets ?? null;
        const modeLabel = formatModeLabel(mode);
        const { main: targetMain, hasValue: targetHasValue } =
            controllerTargetParts(mode, targets);
        const automationLine = formatAutomation24hStat(
            ventFetch?.statistics ?? null
        );
        const actions = Array.isArray(ventFetch?.actions)
            ? ventFetch.actions
            : [];
        const roomsByMotorId = ventFetch?.roomsByMotorId ?? null;
        const refreshDashboard = ventFetch?.refreshDashboard;

        const hvacPower = ventFetch?.hvacPower ?? null;
        const hasPower =
            hvacPower != null &&
            typeof hvacPower.powerW === "number" &&
            Number.isFinite(hvacPower.powerW);
        const powerStr = hasPower ? formatPowerW(hvacPower.powerW) : "—";
        const powerUpdatedStr =
            hvacPower != null
                ? formatRelativeTimeAgo(hvacPower.lastUpdateMs)
                : "—";
        const powerIsStale = hvacPower != null && hvacPower.fresh === false;

        const hvacModeOverride = ventFetch?.hvacModeOverride ?? null;
        const hvacModeOverrideUntilMs =
            ventFetch?.hvacModeOverrideUntilMs ?? null;
        const hasModeOverride = hasActiveHvacModeOverride(
            hvacModeOverride,
            hvacModeOverrideUntilMs
        );
        const modeUntilRemain = formatTimeRemainingUntil(
            hvacModeOverrideUntilMs
        );

        const {
            hvacModeModalOpen,
            hvacModeDraft,
            hvacModeDurationMs,
            hvacModeBusy,
            hvacModeErrorMsg,
            hvacModeHadOverrideAtOpen,
        } = this.state;

        return (
            <Card className="border-0 vent-controller-room-card d-flex flex-column">
                <Modal
                    isOpen={hvacModeModalOpen}
                    toggle={this.closeHvacModeModal}
                    backdrop={hvacModeBusy ? "static" : true}
                >
                    <ModalHeader toggle={this.closeHvacModeModal}>
                        HVAC mode
                    </ModalHeader>
                    <ModalBody>
                        {hvacModeErrorMsg !== "" ? (
                            <p className="text-danger small mb-3" role="alert">
                                {hvacModeErrorMsg}
                            </p>
                        ) : null}
                        <p className="text-muted small mb-3">
                            Temporarily force cooling or heating when
                            auto-detection is wrong. Idle still applies when the
                            unit is off.
                        </p>
                        <FormGroup className="mb-3">
                            <Label
                                for="vent-hvac-mode-select"
                                className="small text-muted"
                            >
                                Mode
                            </Label>
                            <Input
                                type="select"
                                name="vent-hvac-mode-select"
                                id="vent-hvac-mode-select"
                                bsSize="sm"
                                disabled={hvacModeBusy}
                                value={hvacModeDraft}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "cooling" || v === "heating") {
                                        this.setState({ hvacModeDraft: v });
                                    }
                                }}
                            >
                                <option value="cooling">Cooling</option>
                                <option value="heating">Heating</option>
                            </Input>
                        </FormGroup>
                        <FormGroup className="mb-0">
                            <Label
                                for="vent-hvac-mode-duration"
                                className="small text-muted"
                            >
                                Duration
                            </Label>
                            <Input
                                type="select"
                                name="vent-hvac-mode-duration"
                                id="vent-hvac-mode-duration"
                                bsSize="sm"
                                disabled={hvacModeBusy}
                                value={String(hvacModeDurationMs)}
                                onChange={(e) => {
                                    const ms = Number(e.target.value);
                                    if (Number.isFinite(ms)) {
                                        this.setState({
                                            hvacModeDurationMs: ms,
                                        });
                                    }
                                }}
                            >
                                {HVAC_MODE_DURATION_OPTIONS.map((opt) => (
                                    <option
                                        key={opt.ms}
                                        value={String(opt.ms)}
                                    >
                                        {opt.label}
                                    </option>
                                ))}
                            </Input>
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter className="d-flex flex-wrap justify-content-between">
                        <Button
                            color="light"
                            outline
                            disabled={hvacModeBusy}
                            onClick={this.closeHvacModeModal}
                        >
                            Cancel
                        </Button>
                        <div className="d-flex flex-wrap">
                            {hvacModeHadOverrideAtOpen ? (
                                <Button
                                    color="warning"
                                    className="mr-2 mb-2 mb-sm-0"
                                    disabled={hvacModeBusy}
                                    onClick={() => {
                                        void (async () => {
                                            const ok =
                                                await this.resetHvacModeOverride();
                                            if (
                                                ok &&
                                                typeof refreshDashboard ===
                                                    "function"
                                            ) {
                                                await refreshDashboard();
                                            }
                                        })();
                                    }}
                                >
                                    Reset
                                </Button>
                            ) : null}
                            <Button
                                color="primary"
                                disabled={hvacModeBusy}
                                onClick={() => {
                                    void (async () => {
                                        const ok = await this.applyHvacMode();
                                        if (
                                            ok &&
                                            typeof refreshDashboard ===
                                                "function"
                                        ) {
                                            await refreshDashboard();
                                        }
                                    })();
                                }}
                            >
                                {hvacModeHadOverrideAtOpen ? "Update" : "Set"}
                            </Button>
                        </div>
                    </ModalFooter>
                </Modal>
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
                                            <span className="vent-temp-unit">
                                                °C
                                            </span>
                                        </>
                                    ) : (
                                        <span className="vent-temp-value vent-temp-missing">
                                            —
                                        </span>
                                    )}
                                </div>
                                <div className="vent-controller-mode mt-2">
                                    <div
                                        className="d-flex align-items-center flex-wrap vent-clickable-metric text-muted"
                                        role="button"
                                        tabIndex={0}
                                        title="Set HVAC mode override"
                                        onClick={() =>
                                            this.openHvacModeModal(ventFetch)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                this.openHvacModeModal(
                                                    ventFetch
                                                );
                                            }
                                        }}
                                    >
                                        <span>{modeLabel}</span>
                                        {hasModeOverride ? (
                                            <FontAwesomeIcon
                                                className="ml-1 text-warning"
                                                icon={faTimes}
                                                title="Manual override active"
                                                aria-label="Manual override active"
                                            />
                                        ) : null}
                                    </div>
                                    {hasModeOverride &&
                                    modeUntilRemain !== "" ? (
                                        <div className="text-muted small mt-1">
                                            Expires in {modeUntilRemain}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="vent-controller-metrics-right text-right">
                                {targetHasValue &&
                                (mode === "cooling" || mode === "heating") ? (
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
                                <div
                                    className={
                                        "vent-controller-power-value mt-2" +
                                        (hasPower
                                            ? ""
                                            : " vent-controller-power-missing") +
                                        (powerIsStale
                                            ? " vent-controller-power-stale"
                                            : "")
                                    }
                                >
                                    {powerStr}
                                </div>
                                <div className="vent-controller-power-unit text-muted">
                                    HVAC POWER
                                </div>
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
                            <div className="text-muted py-2">
                                No actions recorded.
                            </div>
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
                                                    ok
                                                        ? "text-success"
                                                        : "text-danger"
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
                        <div>
                            Automations (last 24hrs): {automationLine}
                        </div>
                        <div>Updated {powerUpdatedStr}</div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    render() {
        return (
            <VentStateContext.Consumer>
                {(ventFetch) => this.renderCard(ventFetch)}
            </VentStateContext.Consumer>
        );
    }
}

export default VentControllerCard;
