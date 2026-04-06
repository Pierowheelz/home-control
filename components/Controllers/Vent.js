/*!
Home page / Dashboard
*/
import React, {Component} from "react";
import PropTypes from "prop-types";

// reactstrap components
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Progress,
    Spinner,
} from "reactstrap";
import Slider from 'react-rangeslider'
//classes
import WbSession from "classes/Session.jsx";

import { VentStateContext } from "components/Controllers/middleware/VentStateContext.js";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifiSlash, faTimes } from '@fortawesome/pro-solid-svg-icons';

import {
    formatRelativeTimeAgo,
    formatTimeRemainingUntil,
} from "components/Controllers/middleware/ventRelativeTime.js";

/** Minimum room comfort target in the picker (°C). */
const ROOM_TARGET_MIN_C = 18;
/** Maximum room comfort target in the picker (°C). */
const ROOM_TARGET_MAX_C = 25;
/** Slider step for room comfort target (°C). */
const ROOM_TARGET_STEP_C = 0.1;

/**
 * @param {number} c
 * @returns {number}
 */
function clampRoomTargetC(c) {
    const n = Math.round(Number(c) * 10) / 10;
    return Math.min(ROOM_TARGET_MAX_C, Math.max(ROOM_TARGET_MIN_C, n));
}

/**
 * @param {{ roomTargetOverrideC?: number|null, temperatureC?: number|null }|null|undefined} roomRow
 * @returns {number}
 */
function initialRoomTargetDraftC(roomRow) {
    const ov = roomRow?.roomTargetOverrideC;
    if (typeof ov === "number" && Number.isFinite(ov)) {
        return clampRoomTargetC(ov);
    }
    const t = roomRow?.temperatureC;
    if (typeof t === "number" && Number.isFinite(t)) {
        return clampRoomTargetC(t);
    }
    return clampRoomTargetC(21);
}

/**
 * @param {{ room?: string|null, roomTargetOverrideC?: number|null }|null|undefined} roomRow
 * @returns {boolean}
 */
function hasActiveRoomTargetOverride(roomRow) {
    const ov = roomRow?.roomTargetOverrideC;
    return typeof ov === "number" && Number.isFinite(ov);
}

/**
 * @param {{ room?: string|null }|null|undefined} roomRow
 * @param {string} titleProp
 * @returns {string}
 */
function resolveVentRoomKey(roomRow, titleProp) {
    const r = roomRow?.room;
    if (typeof r === "string" && r.trim() !== "") {
        return r.trim();
    }
    if (typeof titleProp === "string" && titleProp.trim() !== "") {
        return titleProp.trim();
    }
    return "";
}

/**
 * Global HVAC target °C for the current mode on room tiles: cooling/heating
 * use the same setpoints as the controller card; `idle` has no global target
 * (shows a dash unless a per-room override is active).
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
        case "idle":
            return { main: "—", hasValue: false };
        default:
            return { main: "—", hasValue: false };
    }
}

/**
 * @param {{ wantOpen?: boolean|null, manualOverrideActive?: boolean }|null|undefined} row
 * @returns {{ label: string, showOverrideX: boolean }}
 */
function wantOpenDisplay(row) {
    if (!row) {
        return { label: "—", showOverrideX: false };
    }
    const wo = row.wantOpen;
    const label =
        wo === true ? "Open" : wo === false ? "Closed" : "—";
    const showOverrideX = row.manualOverrideActive === true;
    return { label, showOverrideX };
}

/**
 * Room rows may aggregate multiple Zigbee sensors; when both primary and
 * alternate per-sensor temperatures are present, the UI shows each reading
 * and freshness instead of a single `lastUpdateMs` line.
 *
 * @param {{
 *   sensorPrimaryTemperatureC?: number|null,
 *   sensorAltTemperatureC?: number|null,
 * }|null|undefined} roomRow
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

class Vent extends Component {
    static contextType = WbSession;
    
    debug = false;
    state = {
        // Data from server
        tmpPosition: 0, // Slider position: 0 -> 100
        position: 0, // Actual vent position: 0 -> 100
        ventName: '',
        /** True while moveVent() is awaiting a response. */
        moveLoading: false,
        moveError: false,
        moveErrorMsg: "",
        /** Per-room comfort target modal */
        roomTargetModalOpen: false,
        roomTargetRoomKey: "",
        roomTargetDraftC: clampRoomTargetC(21),
        /** True if {@link roomTargetRoomKey} had an override when the modal opened (controls Reset / Update labels). */
        roomTargetHadOverrideAtOpen: false,
        roomTargetBusy: false,
        roomTargetErrorMsg: "",
    };
    
    // Timer to update vent position after manual change
    updateTimer = null;

    /** @type {ReturnType<typeof setInterval> | null} */
    relativeTimeTimer = null;
    
    componentDidMount() {
        if( typeof window !== "undefined" ){
            document.addEventListener( 'ventsupdate', this.onVentUpdate );
            this.relativeTimeTimer = setInterval( () => this.forceUpdate(), 10000 );
        }
    }

    componentWillUnmount() {
        if( typeof window !== "undefined" ){
            document.removeEventListener( 'ventsupdate', this.onVentUpdate );
            if( this.relativeTimeTimer !== null ){
                clearInterval( this.relativeTimeTimer );
                this.relativeTimeTimer = null;
            }
        }
    }
    
    onVentUpdate = (e) => {
        const { deviceId } = this.props;
        console.log(e);
        const state = e.detail ?? {};
        console.log('Got vent update: ', state);
        
        if( typeof state[deviceId] != "undefined" ){
            const deviceName = state[deviceId].name ?? '';
            const devicePosition = state[deviceId].pos ?? 0;
        
            this.setState({position: devicePosition, tmpPosition: devicePosition, ventName: deviceName});
        } else {
            console.log('No vent update for device: ', deviceId);
        }
    };
    
    moveVent = async () => {
        const { tmpPosition } = this.state;
        const { deviceId } = this.props;
        
        this.setState({ moveLoading: true });
        
        console.log("Moving vent: ",deviceId, " to ", tmpPosition);
        console.log(this.props);
        const response = await this.context.moveVent( deviceId, tmpPosition );
        console.log('Move Vent response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? false;
        
        let newState = {moveLoading: false, moveError: false, moveErrorMsg: ''};
        if( !success || error ){
            console.warn('Failed to move vent.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.moveError = true;
            newState.moveErrorMsg = errorMsg;
        }
        
        this.setState(newState);
    };

    /**
     * @param {{ room?: string|null, roomTargetOverrideC?: number|null, temperatureC?: number|null }|null|undefined} roomRow
     * @returns {void}
     */
    openRoomTargetModal = (roomRow) => {
        console.log('Open room target modal: ', roomRow);
        const { title } = this.props;
        const roomKey = resolveVentRoomKey(roomRow, title);
        if (!roomKey) {
            if (typeof window !== "undefined") {
                window.alert(
                    "This room has no mapped name. Cannot set a comfort target."
                );
            }
            return;
        }
        this.setState({
            roomTargetModalOpen: true,
            roomTargetRoomKey: roomKey,
            roomTargetDraftC: initialRoomTargetDraftC(roomRow),
            roomTargetHadOverrideAtOpen: hasActiveRoomTargetOverride(roomRow),
            roomTargetErrorMsg: "",
            roomTargetBusy: false,
        });
    };

    /**
     * @returns {void}
     */
    closeRoomTargetModal = () => {
        this.setState({
            roomTargetModalOpen: false,
            roomTargetErrorMsg: "",
            roomTargetBusy: false,
        });
    };

    /**
     * Applies the slider value as the room comfort target.
     *
     * @returns {Promise<boolean>} True when the server accepted the setpoint.
     */
    applyRoomTarget = async () => {
        const { roomTargetRoomKey, roomTargetDraftC } = this.state;
        if (!roomTargetRoomKey) {
            return false;
        }
        this.setState({ roomTargetBusy: true, roomTargetErrorMsg: "" });
        const res = await this.context.setVentRoomTarget(
            roomTargetRoomKey,
            roomTargetDraftC
        );
        if (res === false) {
            this.setState({
                roomTargetBusy: false,
                roomTargetErrorMsg:
                    "Request failed. Check your connection and try again.",
            });
            return false;
        }
        const ok = (res.success ?? false) === true && (res.error ?? "") === "";
        if (!ok) {
            const err =
                typeof res.error === "string" && res.error !== ""
                    ? res.error
                    : "Could not set comfort target.";
            this.setState({ roomTargetBusy: false, roomTargetErrorMsg: err });
            return false;
        }
        this.setState({
            roomTargetBusy: false,
            roomTargetModalOpen: false,
            roomTargetErrorMsg: "",
        });
        return true;
    };

    /**
     * Clears the temporary comfort target override for this room.
     *
     * @returns {Promise<boolean>} True when the server accepted the cancel request.
     */
    resetRoomTargetOverride = async () => {
        const { roomTargetRoomKey } = this.state;
        if (!roomTargetRoomKey) {
            return false;
        }
        this.setState({ roomTargetBusy: true, roomTargetErrorMsg: "" });
        const res = await this.context.cancelVentRoomTarget(roomTargetRoomKey);
        if (res === false) {
            this.setState({
                roomTargetBusy: false,
                roomTargetErrorMsg:
                    "Request failed. Check your connection and try again.",
            });
            return false;
        }
        const ok = (res.success ?? false) === true && (res.error ?? "") === "";
        if (!ok) {
            const err =
                typeof res.error === "string" && res.error !== ""
                    ? res.error
                    : "Could not reset comfort target.";
            this.setState({ roomTargetBusy: false, roomTargetErrorMsg: err });
            return false;
        }
        this.setState({
            roomTargetBusy: false,
            roomTargetModalOpen: false,
            roomTargetErrorMsg: "",
        });
        return true;
    };

    /**
     * @param {boolean} pollLoading
     * @param {boolean} pollError
     * @param {string} pollErrorMsg
     * @param {{ loading?: boolean, error?: boolean, errorMsg?: string, roomsByMotorId?: Record<string, object>, refreshDashboard?: () => Promise<void>, mode?: string, targets?: { coolTargetC?: number, heatTargetC?: number }|null }|null} ventFetch
     * @returns {import("react").ReactNode}
     */
    renderCard(pollLoading, pollError, pollErrorMsg, ventFetch) {
        const {
            tmpPosition, // 0 -> 100
            position, // 0 -> 100
            ventName,
            moveLoading,
            moveError,
            moveErrorMsg,
        } = this.state;
        
        const { deviceId, title } = this.props;

        const loading = pollLoading || moveLoading;
        const error = pollError || moveError;
        const errorMsg = (pollError && pollErrorMsg) || (moveError && moveErrorMsg) || "";

        const roomRow = ventFetch?.roomsByMotorId?.[String(deviceId)] ?? null;
        const hasTemp =
            roomRow != null &&
            typeof roomRow.temperatureC === "number" &&
            Number.isFinite(roomRow.temperatureC);
        const tempMain = hasTemp ? roomRow.temperatureC.toFixed(1) : null;
        const hasHum =
            roomRow != null &&
            typeof roomRow.humidity === "number" &&
            Number.isFinite(roomRow.humidity);
        const humMain = hasHum ? `${Math.round(roomRow.humidity)}` : null;
        const showDualSensorStamp = hasDualRoomTempSensors(roomRow);
        const lastUpStr = formatRelativeTimeAgo(roomRow?.lastUpdateMs);
        const { label: targetLabel, showOverrideX } = wantOpenDisplay(roomRow);
        const hasComfortOverride = hasActiveRoomTargetOverride(roomRow);
        const mode = ventFetch?.mode ?? "unknown";
        const targets = ventFetch?.targets ?? null;
        const { main: globalTargetMain, hasValue: hasGlobalTarget } =
            controllerTargetParts(mode, targets);
        const targetTempDisplay = hasComfortOverride
            ? `${roomRow.roomTargetOverrideC.toFixed(1)} °C`
            : hasGlobalTarget
              ? `${globalTargetMain} °C`
              : "—";
        const comfortUntilRemain = formatTimeRemainingUntil(
            roomRow?.roomTargetOverrideUntilMs ?? null
        );
        const refreshDashboard = ventFetch?.refreshDashboard;

        const {
            roomTargetModalOpen,
            roomTargetDraftC,
            roomTargetBusy,
            roomTargetErrorMsg,
            roomTargetHadOverrideAtOpen,
        } = this.state;

        return (
            <Card className="border-0 vent-room-card h-100 d-flex flex-column">
                <Modal
                    isOpen={roomTargetModalOpen}
                    toggle={this.closeRoomTargetModal}
                    backdrop={roomTargetBusy ? "static" : true}
                >
                    <ModalHeader toggle={this.closeRoomTargetModal}>
                        Comfort target — {title}
                    </ModalHeader>
                    <ModalBody>
                        {roomTargetErrorMsg !== "" ? (
                            <p className="text-danger small mb-3" role="alert">
                                {roomTargetErrorMsg}
                            </p>
                        ) : null}
                        <p className="text-muted small mb-2">
                            Temporary room setpoint for automation (18–25&nbsp;°C).
                            Global HVAC targets on the controller card are unchanged.
                        </p>
                        <div className="text-center mb-2 h2">
                            {roomTargetDraftC.toFixed(1)}
                            <span className="h4 text-muted"> °C</span>
                        </div>
                        <div className="vent-room-target-modal-slider">
                            <Slider
                                value={roomTargetDraftC}
                                min={ROOM_TARGET_MIN_C}
                                max={ROOM_TARGET_MAX_C}
                                step={ROOM_TARGET_STEP_C}
                                onChange={(v) => {
                                    this.setState({
                                        roomTargetDraftC: clampRoomTargetC(v),
                                    });
                                }}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter className="d-flex flex-wrap justify-content-between">
                        <Button
                            color="secondary"
                            outline
                            disabled={roomTargetBusy}
                            onClick={this.closeRoomTargetModal}
                        >
                            Cancel
                        </Button>
                        <div className="d-flex flex-wrap">
                            {roomTargetHadOverrideAtOpen ? (
                                <Button
                                    color="warning"
                                    className="mr-2 mb-2 mb-sm-0"
                                    disabled={roomTargetBusy}
                                    onClick={() => {
                                        void (async () => {
                                            const ok =
                                                await this.resetRoomTargetOverride();
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
                                disabled={
                                    roomTargetBusy || this.state.roomTargetRoomKey === ""
                                }
                                onClick={() => {
                                    void (async () => {
                                        const ok = await this.applyRoomTarget();
                                        if (
                                            ok &&
                                            typeof refreshDashboard === "function"
                                        ) {
                                            await refreshDashboard();
                                        }
                                    })();
                                }}
                            >
                                {roomTargetHadOverrideAtOpen ? "Update" : "Set"}
                            </Button>
                        </div>
                    </ModalFooter>
                </Modal>
                <CardHeader>
                    <h2 className="mb-0">{title}</h2>
                </CardHeader>
                <CardBody className="d-flex flex-column flex-grow-1 pt-3 pb-0">
                    <div className="vent-card-metrics mb-4">
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="vent-card-metrics-left pr-2">
                                <div
                                    className="vent-temp-row d-flex align-items-baseline flex-wrap vent-clickable-metric"
                                    role="button"
                                    tabIndex={0}
                                    title="Set comfort target"
                                    onClick={() => this.openRoomTargetModal(roomRow)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            this.openRoomTargetModal(roomRow);
                                        }
                                    }}
                                >
                                    {hasTemp ? (
                                        <>
                                            <span className="vent-temp-value">{tempMain}</span>
                                            <span className="vent-temp-unit">°C</span>
                                        </>
                                    ) : (
                                        <span className="vent-temp-value vent-temp-missing">—</span>
                                    )}
                                </div>
                                <div className="vent-target-line mt-2">
                                    <div className="d-flex align-items-center flex-wrap">
                                        <span className="vent-target-label text-muted text-uppercase font-weight-bold mr-2">
                                            Target
                                        </span>
                                        <div
                                            className="vent-target-value d-flex align-items-center flex-wrap vent-clickable-metric"
                                            role="button"
                                            tabIndex={0}
                                            title="Set or adjust room target temperature"
                                            onClick={() =>
                                                this.openRoomTargetModal(roomRow)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    this.openRoomTargetModal(roomRow);
                                                }
                                            }}
                                        >
                                            <span>{targetTempDisplay}</span>
                                            <span className="text-muted ml-1">
                                                ({targetLabel})
                                            </span>
                                            {showOverrideX ? (
                                                <FontAwesomeIcon
                                                    className="ml-1 text-warning"
                                                    icon={faTimes}
                                                    title="Manual override active"
                                                    aria-label="Manual override active"
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                    {hasComfortOverride &&
                                    comfortUntilRemain !== "" ? (
                                        <div className="text-muted small mt-1">
                                            Expires in {comfortUntilRemain}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="vent-card-metrics-right text-right">
                                {hasHum ? (
                                    <>
                                        <div className="vent-humidity-value">{humMain}</div>
                                        <div className="vent-humidity-unit text-muted">% RH</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="vent-humidity-value vent-humidity-missing">—</div>
                                        <div className="vent-humidity-unit text-muted">% RH</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="ventState d-flex flex-column">
                    <div className=" progress-wrapper">
                        <div className=" progress-info">
                            <div className=" progress-label">
                                <span>{ventName}</span>
                            </div>
                            <div className=" progress-percentage">
                                <span><input
                                    type="number"
                                    className="ventInput"
                                    value={tmpPosition}
                                    onChange={(event)=>{
                                        console.log('newval: ',event.target.value);
                                        let value = event.target.value;
                                        value = Math.min( value, 175 );
                                        value = Math.max( value, 0 );
                                        
                                        this.setState({tmpPosition:value});
                                        
                                        // Update real vent position after 0.5s with no input
                                        clearInterval(this.updateTimer);
                                        this.updateTimer = setTimeout(() => {
                                            const { tmpPosition, position } = this.state;
                                            
                                            if( tmpPosition > 100 && confirm('Warning, moving vent beyond 100% may cause damage. Continue to '+tmpPosition+'% ?') ){
                                                this.moveVent();
                                            } else if ( tmpPosition > 100 ){
                                                // User clicked 'no'. Reset tmp pos.
                                                this.setState({tmpPosition:position});
                                            }
                                        },1000);
                                    }}
                                />%</span>
                            </div>
                        </div>
                        <Progress max="100" value={position} color="default"></Progress>
                    </div>
                        {loading ? (
                            <div className="ventStateLoader text-center">
                                <Spinner color="primary" />
                                <p></p>
                            </div>
                        ) : (<>
                            {error ? (
                                <div className="doorStateLoader text-center" title={errorMsg || undefined}>
                                    <FontAwesomeIcon className="cmError" icon={faWifiSlash} />
                                    <p></p>
                                </div>
                            ) : null}
                        </>)}
                        <p className="text-align-centre">{position}%</p>
                    </div>
                    <Slider
                        value={tmpPosition}
                        min={0}
                        max={100}
                        step={5}
                        onChange={( newPos ) => {
                            console.log('Slider move: ',newPos);
                            this.setState({tmpPosition:newPos});
                        }}
                        onChangeComplete={() => {
                            console.log('Position slider moved to: ', tmpPosition);
                            this.moveVent();
                        }}
                    />
                    <div className="vent-card-stamp text-muted small text-right">
                        {showDualSensorStamp ? (
                            <>
                                <div>
                                    Primary{" "}
                                    {roomRow.sensorPrimaryTemperatureC.toFixed(1)}{" "}
                                    °C ·{" "}
                                    {formatRelativeTimeAgo(
                                        roomRow.sensorPrimaryLastUpdateMs
                                    )}
                                </div>
                                <div className="mt-1">
                                    Alt{" "}
                                    {roomRow.sensorAltTemperatureC.toFixed(1)} °C ·{" "}
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
    
    render(){
        return (
            <VentStateContext.Consumer>
                {(ventFetch) => {
                    const pollLoading = ventFetch?.loading ?? false;
                    const pollError = ventFetch?.error ?? false;
                    const pollErrorMsg = ventFetch?.errorMsg ?? "";
                    return this.renderCard(pollLoading, pollError, pollErrorMsg, ventFetch);
                }}
            </VentStateContext.Consumer>
        );
    }
}

Vent.propTypes = {
    title: PropTypes.string,
    deviceId: PropTypes.string,
};

Vent.defaultProps = {
    title: 'Vent',
    deviceId: "0",
}

export default Vent;
