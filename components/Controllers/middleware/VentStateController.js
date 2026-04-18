/*!
 * Coordinates periodic `GET /vents/actions` polling so one dashboard request
 * serves every Vent on the page (temps, humidity, automation targets, positions).
 */
import React, { Component } from "react";
import PropTypes from "prop-types";

import WbSession from "classes/Session.jsx";
import { VentStateContext } from "./VentStateContext.js";

/**
 * Coerce a raw `/vents/actions` `hvacPower` payload into a normalised struct
 * or `null` when the field is missing/invalid.
 *
 * @param {unknown} raw
 * @returns {import("./VentStateContext.js").VentHvacPower|null}
 */
function parseHvacPower(raw) {
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }
    /** @type {Record<string, unknown>} */
    const obj = raw;
    /**
     * @param {unknown} v
     * @returns {number|null}
     */
    const num = (v) =>
        typeof v === "number" && Number.isFinite(v) ? v : null;
    return {
        thresholdW: num(obj.thresholdW),
        powerW: num(obj.powerW),
        lastUpdateMs: num(obj.lastUpdateMs),
        fresh: obj.fresh === true,
        active: obj.active === true,
        lastActiveTempBasedHvacMode:
            typeof obj.lastActiveTempBasedHvacMode === "string" &&
            obj.lastActiveTempBasedHvacMode !== ""
                ? obj.lastActiveTempBasedHvacMode
                : null,
    };
}

export default class VentStateController extends Component {
    static contextType = WbSession;

    static propTypes = {
        children: PropTypes.node,
        /** Polling interval in milliseconds. */
        pollIntervalMs: PropTypes.number,
    };

    static defaultProps = {
        pollIntervalMs: 30000,
    };

    state = {
        loading: false,
        error: false,
        errorMsg: "",
        roomsByMotorId: {},
        controllerTempC: null,
        mode: "unknown",
        targets: null,
        actions: [],
        statistics: null,
        sensorOnlyRooms: [],
        hvacPower: null,
    };

    /** @type {ReturnType<typeof setInterval> | null} */
    intervalTimer = null;

    /**
     * Incremented at the start of each dashboard fetch; responses with a stale
     * generation are ignored so overlapping polls do not corrupt state.
     *
     * @type {number}
     */
    fetchGeneration = 0;

    componentDidMount() {
        this.fetchVentState();
        this.intervalTimer = setInterval(
            () => this.fetchVentState(),
            this.props.pollIntervalMs
        );
    }

    componentWillUnmount() {
        if (this.intervalTimer !== null) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
    }

    /**
     * Polls vent dashboard once. Overlapping calls are allowed; each response
     * carries a generation stamp so only the latest applied result updates state.
     * Successful responses dispatch `ventsupdate` from {@link WbSession#getVentsDashboard}.
     *
     * @returns {Promise<void>}
     */
    fetchVentState = async () => {
        const gen = ++this.fetchGeneration;
        this.setState({ loading: true, error: false, errorMsg: "" });

        const response = await this.context.getVentsDashboard();
        console.log("Vents dashboard response: ", response);

        if (gen !== this.fetchGeneration) {
            return;
        }

        if (response === false) {
            this.setState({
                loading: false,
                error: false,
                errorMsg: "",
                roomsByMotorId: {},
                controllerTempC: null,
                mode: "unknown",
                targets: null,
                actions: [],
                statistics: null,
                sensorOnlyRooms: [],
                hvacPower: null,
            });
            return;
        }

        const success = response.success ?? false;
        const error = response.error ?? false;

        let newState = {
            loading: false,
            error: false,
            errorMsg: "",
            roomsByMotorId: { ...this.state.roomsByMotorId },
            controllerTempC: this.state.controllerTempC,
            mode: this.state.mode,
            targets: this.state.targets,
            actions: this.state.actions,
            statistics: this.state.statistics,
            sensorOnlyRooms: this.state.sensorOnlyRooms,
            hvacPower: this.state.hvacPower,
        };
        if (!success || error) {
            console.warn("Failed to fetch vent dashboard.", response);
            const errorMsg =
                response.error ||
                "Failed to fetch status. Please try again later.";
            newState.error = true;
            newState.errorMsg = errorMsg;
        } else {
            newState.controllerTempC =
                typeof response.controllerTempC === "number" &&
                Number.isFinite(response.controllerTempC)
                    ? response.controllerTempC
                    : null;
            newState.mode =
                typeof response.mode === "string" ? response.mode : "unknown";
            newState.targets =
                response.targets != null &&
                typeof response.targets === "object" &&
                !Array.isArray(response.targets)
                    ? {
                          coolTargetC: response.targets.coolTargetC,
                          heatTargetC: response.targets.heatTargetC,
                          roomHysteresisC: response.targets.roomHysteresisC,
                      }
                    : null;
            newState.actions = Array.isArray(response.actions)
                ? response.actions
                : [];
            newState.statistics =
                response.statistics != null &&
                typeof response.statistics === "object" &&
                !Array.isArray(response.statistics)
                    ? { ...response.statistics }
                    : null;
            newState.hvacPower = parseHvacPower(response.hvacPower);

            if (Array.isArray(response.rooms)) {
                /** @type {Record<string, object>} */
                const roomsByMotorId = {};
                /** @type {object[]} */
                const sensorOnlyRooms = [];
                for (const row of response.rooms) {
                    const mid = row.motorId;
                    if (mid === undefined || mid === null) {
                        sensorOnlyRooms.push(row);
                        continue;
                    }
                    roomsByMotorId[String(mid)] = row;
                }
                newState.roomsByMotorId = roomsByMotorId;
                newState.sensorOnlyRooms = sensorOnlyRooms;
            }
        }

        if (gen !== this.fetchGeneration) {
            return;
        }

        this.setState(newState);
    };

    render() {
        const value = {
            ...this.state,
            refreshDashboard: this.fetchVentState,
        };
        return (
            <VentStateContext.Provider value={value}>
                {this.props.children}
            </VentStateContext.Provider>
        );
    }
}
