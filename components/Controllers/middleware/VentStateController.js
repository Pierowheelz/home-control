/*!
 * Coordinates periodic `GET /vents/actions` polling so one dashboard request
 * serves every Vent on the page (temps, humidity, automation targets, positions).
 */
import React, { Component } from "react";
import PropTypes from "prop-types";

import WbSession from "classes/Session.jsx";
import { VentStateContext } from "./VentStateContext.js";

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
    };

    /** @type {ReturnType<typeof setInterval> | null} */
    intervalTimer = null;

    /** When true, a {@link WbSession#getVentsDashboard} call is still running. */
    requestInFlight = false;

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
     * Polls vent dashboard once. If a poll is already running, returns immediately.
     * Successful responses dispatch `ventsupdate` from {@link WbSession#getVentsDashboard}.
     *
     * @returns {Promise<void>}
     */
    fetchVentState = async () => {
        if (this.requestInFlight) {
            return;
        }

        this.requestInFlight = true;
        this.setState({ loading: true, error: false, errorMsg: "" });

        const response = await this.context.getVentsDashboard();
        console.log("Vents dashboard response: ", response);

        if (response === false) {
            this.requestInFlight = false;
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

            if (Array.isArray(response.rooms)) {
                /** @type {Record<string, object>} */
                const roomsByMotorId = {};
                for (const row of response.rooms) {
                    const mid = row.motorId;
                    if (mid === undefined || mid === null) {
                        continue;
                    }
                    roomsByMotorId[String(mid)] = row;
                }
                newState.roomsByMotorId = roomsByMotorId;
            }
        }

        this.setState(newState);
        this.requestInFlight = false;
    };

    render() {
        return (
            <VentStateContext.Provider value={this.state}>
                {this.props.children}
            </VentStateContext.Provider>
        );
    }
}
