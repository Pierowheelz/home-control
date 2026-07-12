/*!
 * Coordinates periodic `GET /bulbs` polling so one request serves every
 * LightFixture card on the page.
 */
import React, { Component } from "react";
import PropTypes from "prop-types";

import WbSession from "classes/Session.jsx";
import { LightFixtureStateContext } from "./LightFixtureStateContext.js";

export default class LightFixtureStateController extends Component {
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
        /** @type {Record<string, import("./LightFixtureStateContext.js").LightFixtureSnapshot>} */
        fixturesById: {},
    };

    /** @type {ReturnType<typeof setInterval> | null} */
    intervalTimer = null;

    /**
     * Incremented at the start of each fetch; stale responses are ignored.
     *
     * @type {number}
     */
    fetchGeneration = 0;

    componentDidMount() {
        this.fetchBulbsState();
        this.intervalTimer = setInterval(
            () => this.fetchBulbsState(),
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
     * Polls bulb fixtures once. Overlapping calls are allowed; each response
     * carries a generation stamp so only the latest applied result updates state.
     *
     * @returns {Promise<void>}
     */
    fetchBulbsState = async () => {
        const gen = ++this.fetchGeneration;
        this.setState({ loading: true, error: false, errorMsg: "" });

        const response = await this.context.getBulbs();

        if (gen !== this.fetchGeneration) {
            return;
        }

        if (response === false) {
            this.setState({
                loading: false,
                error: false,
                errorMsg: "",
                fixturesById: {},
            });
            return;
        }

        const hasError =
            response.error != null &&
            response.error !== false &&
            response.error !== "";
        const fixtures = Array.isArray(response.fixtures)
            ? response.fixtures
            : null;

        if (hasError || fixtures === null) {
            console.warn("Failed to fetch light fixtures.", response);
            this.setState({
                loading: false,
                error: true,
                errorMsg:
                    (typeof response.error === "string" && response.error) ||
                    (typeof response.message === "string" &&
                        response.message) ||
                    "Failed to fetch status. Please try again later.",
            });
            return;
        }

        /** @type {Record<string, import("./LightFixtureStateContext.js").LightFixtureSnapshot>} */
        const fixturesById = {};
        for (const snap of fixtures) {
            if (
                snap != null &&
                typeof snap === "object" &&
                typeof snap.fixtureId === "string" &&
                snap.fixtureId !== ""
            ) {
                fixturesById[snap.fixtureId] = snap;
            }
        }

        if (gen !== this.fetchGeneration) {
            return;
        }

        this.setState({
            loading: false,
            error: false,
            errorMsg: "",
            fixturesById,
        });
    };

    render() {
        const value = {
            ...this.state,
            refreshDashboard: this.fetchBulbsState,
        };
        return (
            <LightFixtureStateContext.Provider value={value}>
                {this.props.children}
            </LightFixtureStateContext.Provider>
        );
    }
}
