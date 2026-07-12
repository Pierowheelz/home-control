/*!
 * Zigbee light fixture controller card: target vs actual, dual sliders, override reset.
 */
import React, { Component } from "react";
import PropTypes from "prop-types";

import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Spinner,
} from "reactstrap";
import Slider from "react-rangeslider";

import WbSession from "classes/Session.jsx";
import { LightFixtureStateContext } from "components/Controllers/middleware/LightFixtureStateContext.js";
import {
    formatRelativeTimeAgo,
    formatTimeRemainingUntil,
} from "components/Controllers/middleware/ventRelativeTime.js";
import LightFixtureSignalPill from "components/Controllers/LightFixtureSignalPill.js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWifiSlash, faTimes } from "@fortawesome/pro-solid-svg-icons";

/** Minimum brightness for the slider / overrides (API allows 0; UI starts at 1%). */
const BRIGHTNESS_MIN = 1;
/** Maximum brightness. */
const BRIGHTNESS_MAX = 100;

/** Minimum colour-temp Kelvin on the slider (UI floor; API allows 2000). */
const COLOUR_TEMP_MIN_K = 2700;
/** Maximum colour-temp Kelvin for the slider. */
const COLOUR_TEMP_MAX_K = 6500;
/** Colour-temp slider step (Kelvin) for values above red. */
const COLOUR_TEMP_STEP_K = 50;

/**
 * Max slider index: `0` = red, `1` = 2700 K, … up to 6500 K.
 * Nothing exists between red and 2700.
 */
const COLOUR_SLIDER_MAX_INDEX =
    1 + Math.round((COLOUR_TEMP_MAX_K - COLOUR_TEMP_MIN_K) / COLOUR_TEMP_STEP_K);

/**
 * Clamps a Kelvin value into the white-CT slider range (not red).
 *
 * @param {number} k
 * @returns {number}
 */
function clampColourTempK(k) {
    const n = Math.round(Number(k));
    if (!Number.isFinite(n)) {
        return COLOUR_TEMP_MIN_K;
    }
    return Math.min(COLOUR_TEMP_MAX_K, Math.max(COLOUR_TEMP_MIN_K, n));
}

/**
 * Normalises an API colour for draft/commit: `0` (red) or Kelvin 2700–6500.
 *
 * @param {number} colour
 * @returns {number}
 */
function clampColour(colour) {
    const n = Math.round(Number(colour));
    if (!Number.isFinite(n) || n <= 0) {
        return 0;
    }
    return clampColourTempK(n);
}

/**
 * Maps API colour → discontinuous slider index (`0` = red).
 *
 * @param {number|null|undefined} colour
 * @returns {number}
 */
function colourToSliderIndex(colour) {
    if (colour == null || !Number.isFinite(colour) || colour === 0) {
        return 0;
    }
    const k = clampColourTempK(colour);
    return (
        1 + Math.round((k - COLOUR_TEMP_MIN_K) / COLOUR_TEMP_STEP_K)
    );
}

/**
 * Maps discontinuous slider index → API colour (`0` = red).
 *
 * @param {number} index
 * @returns {number}
 */
function sliderIndexToColour(index) {
    const i = Math.round(Number(index));
    if (!Number.isFinite(i) || i <= 0) {
        return 0;
    }
    const capped = Math.min(COLOUR_SLIDER_MAX_INDEX, Math.max(1, i));
    return clampColourTempK(
        COLOUR_TEMP_MIN_K + (capped - 1) * COLOUR_TEMP_STEP_K
    );
}

/**
 * @param {number} b
 * @returns {number}
 */
function clampBrightness(b) {
    const n = Math.round(Number(b));
    if (!Number.isFinite(n)) {
        return BRIGHTNESS_MIN;
    }
    return Math.min(BRIGHTNESS_MAX, Math.max(BRIGHTNESS_MIN, n));
}

/**
 * Formats a colour value for display: Red, Kelvin, or em dash.
 *
 * @param {number|null|undefined} colour
 * @returns {string}
 */
function formatColour(colour) {
    if (colour == null || !Number.isFinite(colour)) {
        return "—";
    }
    if (colour === 0) {
        return "Red";
    }
    return `${Math.round(colour)} K`;
}

/**
 * True when the fixture has a non-expired manual override.
 *
 * @param {import("components/Controllers/middleware/LightFixtureStateContext.js").LightFixtureSnapshot|null|undefined} fixture
 * @returns {boolean}
 */
function isOverrideActive(fixture) {
    if (fixture == null || fixture.overrideState == null) {
        return false;
    }
    const until = fixture.overrideExpiry;
    if (until == null || !Number.isFinite(until)) {
        return true;
    }
    return Date.now() < until;
}

/**
 * Primary bulb device state (first address in `bulbs[]`), or first bulb with
 * any non-null reading.
 *
 * @param {import("components/Controllers/middleware/LightFixtureStateContext.js").LightFixtureSnapshot|null|undefined} fixture
 * @returns {import("components/Controllers/middleware/LightFixtureStateContext.js").LightFixtureBulbDeviceState|null}
 */
function primaryBulbState(fixture) {
    if (fixture == null) {
        return null;
    }
    const byBulb = fixture.deviceStateByBulb;
    if (byBulb == null || typeof byBulb !== "object") {
        return null;
    }
    const bulbs = Array.isArray(fixture.bulbs) ? fixture.bulbs : [];
    if (bulbs.length > 0) {
        const primary = byBulb[bulbs[0]];
        if (primary != null && typeof primary === "object") {
            return primary;
        }
    }
    for (const addr of bulbs) {
        const st = byBulb[addr];
        if (st != null && typeof st === "object") {
            return st;
        }
    }
    for (const st of Object.values(byBulb)) {
        if (st != null && typeof st === "object") {
            return st;
        }
    }
    return null;
}

/**
 * Best available linkQuality: primary bulb first, else first non-null LQI.
 *
 * @param {import("components/Controllers/middleware/LightFixtureStateContext.js").LightFixtureSnapshot|null|undefined} fixture
 * @returns {number|null}
 */
function fixtureLinkQuality(fixture) {
    if (fixture == null) {
        return null;
    }
    const byBulb = fixture.deviceStateByBulb;
    if (byBulb == null || typeof byBulb !== "object") {
        return null;
    }
    const bulbs = Array.isArray(fixture.bulbs) ? fixture.bulbs : [];
    if (bulbs.length > 0) {
        const primary = byBulb[bulbs[0]];
        const lq = primary?.linkQuality;
        if (typeof lq === "number" && Number.isFinite(lq)) {
            return lq;
        }
    }
    for (const st of Object.values(byBulb)) {
        const lq = st?.linkQuality;
        if (typeof lq === "number" && Number.isFinite(lq)) {
            return lq;
        }
    }
    return null;
}

/**
 * Formats brightness for the target/actual lines.
 *
 * @param {number|null|undefined} brightness
 * @returns {string}
 */
function formatBrightness(brightness) {
    if (brightness == null || !Number.isFinite(brightness)) {
        return "—";
    }
    return `${Math.round(brightness)}%`;
}

/**
 * Label for the colour-temp slider draft (`0` → Red).
 *
 * @param {number} colour
 * @returns {string}
 */
function formatColourDraft(colour) {
    if (colour === 0) {
        return "Red";
    }
    return `${Math.round(colour)} K`;
}

/**
 * Fingerprint of desired state used to decide when to re-seed slider drafts.
 *
 * @param {import("components/Controllers/middleware/LightFixtureStateContext.js").LightFixtureSnapshot|null|undefined} fixture
 * @returns {string}
 */
function desiredFingerprint(fixture) {
    const desired = fixture?.desiredState;
    if (desired == null) {
        return "";
    }
    return `${desired.brightness ?? "x"}:${desired.colour ?? "x"}`;
}

/**
 * Inner card that receives fixture data as props (so drafts can sync in
 * `componentDidUpdate` without setState-during-render).
 */
class LightFixtureCard extends Component {
    static contextType = WbSession;

    state = {
        /** @type {number} */
        draftBrightness: BRIGHTNESS_MIN,
        /** Draft API colour: `0` = red, else Kelvin 2700–6500. */
        draftColour: 0,
        /** True while a set/reset request is in flight. */
        actionLoading: false,
        /** Local action error (set/reset), separate from poll error. */
        actionError: false,
        actionErrorMsg: "",
        /** Fingerprint of desired state used for last draft sync. */
        syncedFingerprint: "",
    };

    componentDidMount() {
        this.syncDraftsFromFixture(this.props.fixture);
    }

    componentDidUpdate(prevProps) {
        if (this.state.actionLoading) {
            return;
        }
        if (
            prevProps.fixture !== this.props.fixture ||
            desiredFingerprint(prevProps.fixture) !==
                desiredFingerprint(this.props.fixture)
        ) {
            this.syncDraftsFromFixture(this.props.fixture);
        }
    }

    /**
     * Sync draft sliders from fixture desired state when remote values change.
     *
     * @param {import("components/Controllers/middleware/LightFixtureStateContext.js").LightFixtureSnapshot|null|undefined} fixture
     * @returns {void}
     */
    syncDraftsFromFixture(fixture) {
        if (fixture == null || this.state.actionLoading) {
            return;
        }
        const desired = fixture.desiredState;
        const brightness =
            desired != null && Number.isFinite(desired.brightness)
                ? clampBrightness(desired.brightness)
                : BRIGHTNESS_MIN;
        const colour = clampColour(
            desired != null && Number.isFinite(desired.colour)
                ? desired.colour
                : 0
        );
        const fingerprint = desiredFingerprint(fixture);
        if (this.state.syncedFingerprint === fingerprint) {
            return;
        }
        this.setState({
            draftBrightness: brightness,
            draftColour: colour,
            syncedFingerprint: fingerprint,
        });
    }

    /**
     * Commits both draft sliders as a fixture override.
     *
     * @returns {Promise<boolean>}
     */
    applyOverride = async () => {
        const { fixtureId, refreshDashboard } = this.props;
        const { draftBrightness, draftColour } = this.state;
        this.setState({
            actionLoading: true,
            actionError: false,
            actionErrorMsg: "",
        });
        const response = await this.context.setBulbFixture(
            fixtureId,
            clampBrightness(draftBrightness),
            clampColour(draftColour)
        );
        if (
            response === false ||
            (response.error != null &&
                response.error !== false &&
                response.error !== "")
        ) {
            const msg =
                (typeof response?.message === "string" && response.message) ||
                (typeof response?.error === "string" && response.error) ||
                "Failed to set fixture.";
            this.setState({
                actionLoading: false,
                actionError: true,
                actionErrorMsg: msg,
            });
            return false;
        }
        this.setState({ actionLoading: false });
        if (typeof refreshDashboard === "function") {
            await refreshDashboard();
        }
        return true;
    };

    /**
     * Clears the active override.
     *
     * @returns {Promise<boolean>}
     */
    resetOverride = async () => {
        const { fixtureId, refreshDashboard } = this.props;
        this.setState({
            actionLoading: true,
            actionError: false,
            actionErrorMsg: "",
        });
        const response = await this.context.resetBulbFixture(fixtureId);
        if (
            response === false ||
            (response.error != null &&
                response.error !== false &&
                response.error !== "")
        ) {
            const msg =
                (typeof response?.message === "string" && response.message) ||
                (typeof response?.error === "string" && response.error) ||
                "Failed to reset fixture.";
            this.setState({
                actionLoading: false,
                actionError: true,
                actionErrorMsg: msg,
            });
            return false;
        }
        this.setState({ actionLoading: false });
        if (typeof refreshDashboard === "function") {
            await refreshDashboard();
        }
        return true;
    };

    render() {
        const { title, fixture, loading, error, errorMsg } = this.props;
        const {
            draftBrightness,
            draftColour,
            actionLoading,
            actionError,
            actionErrorMsg,
        } = this.state;

        const desired = fixture?.desiredState ?? null;
        const primary = primaryBulbState(fixture);
        const overrideActive = isOverrideActive(fixture);
        const overrideRemain = overrideActive
            ? formatTimeRemainingUntil(fixture?.overrideExpiry)
            : "";
        const linkQuality = fixtureLinkQuality(fixture);
        const lastUpStr = formatRelativeTimeAgo(primary?.lastUpdateMs);

        const targetBrightness = formatBrightness(desired?.brightness);
        const targetColour = formatColour(desired?.colour);
        const actualBrightness = formatBrightness(primary?.brightness);
        const actualColour = formatColour(primary?.colour);
        const actualPower =
            primary?.power === "on" || primary?.power === "off"
                ? primary.power
                : null;

        const showBusy = actionLoading || (loading && fixture == null);

        return (
            <Card className="light-fixture-card h-100 d-flex flex-column">
                <LightFixtureSignalPill linkQuality={linkQuality} />
                <CardHeader>
                    <h2 className="mb-0">{title}</h2>
                </CardHeader>
                <CardBody className="d-flex flex-column flex-grow-1 pt-3 pb-0">
                    <div className="light-fixture-metrics mb-3">
                        <div className="light-fixture-status-line">
                            <span className="light-fixture-status-label text-muted text-uppercase font-weight-bold mr-2">
                                Target
                            </span>
                            <span className="light-fixture-status-value">
                                {targetBrightness}
                                <span className="text-muted ml-1">
                                    · {targetColour}
                                </span>
                                {overrideActive ? (
                                    <FontAwesomeIcon
                                        className="ml-1 text-warning"
                                        icon={faTimes}
                                        title="Manual override active"
                                        aria-label="Manual override active"
                                    />
                                ) : null}
                            </span>
                        </div>
                        {overrideActive && overrideRemain !== "" ? (
                            <div className="text-muted small mt-1">
                                Expires in {overrideRemain}
                            </div>
                        ) : null}
                        <div className="light-fixture-status-line mt-2">
                            <span className="light-fixture-status-label text-muted text-uppercase font-weight-bold mr-2">
                                Actual
                            </span>
                            <span className="light-fixture-status-value">
                                {actualBrightness}
                                <span className="text-muted ml-1">
                                    · {actualColour}
                                </span>
                                {actualPower != null ? (
                                    <span className="text-muted ml-1">
                                        ({actualPower})
                                    </span>
                                ) : null}
                            </span>
                        </div>
                    </div>

                    <div className="light-fixture-sliders flex-grow-1">
                        <div className="light-fixture-slider-block mb-3">
                            <div className="d-flex justify-content-between align-items-baseline mb-1">
                                <span className="text-muted small text-uppercase font-weight-bold">
                                    Brightness
                                </span>
                                <span className="small">{draftBrightness}%</span>
                            </div>
                            <Slider
                                value={draftBrightness}
                                min={BRIGHTNESS_MIN}
                                max={BRIGHTNESS_MAX}
                                step={1}
                                onChange={(v) => {
                                    this.setState({
                                        draftBrightness: clampBrightness(v),
                                    });
                                }}
                                onChangeComplete={() => {
                                    void this.applyOverride();
                                }}
                            />
                        </div>
                        <div className="light-fixture-slider-block mb-3">
                            <div className="d-flex justify-content-between align-items-baseline mb-1">
                                <span className="text-muted small text-uppercase font-weight-bold">
                                    Colour temp
                                </span>
                                <span className="small">
                                    {formatColourDraft(draftColour)}
                                </span>
                            </div>
                            <Slider
                                value={colourToSliderIndex(draftColour)}
                                min={0}
                                max={COLOUR_SLIDER_MAX_INDEX}
                                step={1}
                                onChange={(v) => {
                                    this.setState({
                                        draftColour: sliderIndexToColour(v),
                                    });
                                }}
                                onChangeComplete={() => {
                                    void this.applyOverride();
                                }}
                            />
                        </div>
                    </div>

                    {overrideActive ? (
                        <div className="mb-3">
                            <Button
                                color="warning"
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => {
                                    void this.resetOverride();
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    ) : null}

                    {showBusy ? (
                        <div className="light-fixture-loader text-center mb-2">
                            <Spinner color="primary" size="sm" />
                        </div>
                    ) : null}
                    {error || actionError ? (
                        <div
                            className="text-center mb-2"
                            title={actionErrorMsg || errorMsg || undefined}
                        >
                            <FontAwesomeIcon
                                className="cmError"
                                icon={faWifiSlash}
                            />
                        </div>
                    ) : null}

                    <div className="light-fixture-stamp text-muted small text-right mt-auto mb-2">
                        {lastUpStr}
                    </div>
                </CardBody>
            </Card>
        );
    }
}

LightFixtureCard.propTypes = {
    title: PropTypes.string.isRequired,
    fixtureId: PropTypes.string.isRequired,
    fixture: PropTypes.object,
    loading: PropTypes.bool,
    error: PropTypes.bool,
    errorMsg: PropTypes.string,
    refreshDashboard: PropTypes.func,
};

/**
 * Light fixture card wired to {@link LightFixtureStateContext}.
 */
class LightFixture extends Component {
    render() {
        const { title, fixtureId } = this.props;
        return (
            <LightFixtureStateContext.Consumer>
                {(fetchState) => {
                    const fixture =
                        fetchState?.fixturesById != null
                            ? fetchState.fixturesById[fixtureId] ?? null
                            : null;
                    return (
                        <LightFixtureCard
                            title={title}
                            fixtureId={fixtureId}
                            fixture={fixture}
                            loading={fetchState?.loading === true}
                            error={fetchState?.error === true}
                            errorMsg={fetchState?.errorMsg || ""}
                            refreshDashboard={fetchState?.refreshDashboard}
                        />
                    );
                }}
            </LightFixtureStateContext.Consumer>
        );
    }
}

LightFixture.propTypes = {
    title: PropTypes.string,
    fixtureId: PropTypes.string.isRequired,
};

LightFixture.defaultProps = {
    title: "Light",
};

export default LightFixture;
