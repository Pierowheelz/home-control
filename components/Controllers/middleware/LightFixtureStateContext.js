import { createContext } from "react";

/**
 * Desired / override brightness + colour for a fixture.
 *
 * @typedef {Object} LightFixtureDesiredState
 * @property {number} brightness 0–100
 * @property {number} colour `0` = red RGB; positive = Kelvin
 */

/**
 * Per-bulb reported state from MQTT cache.
 *
 * @typedef {Object} LightFixtureBulbDeviceState
 * @property {number|null} brightness
 * @property {number|null} colour
 * @property {'on'|'off'|null} power
 * @property {number|null} lastUpdateMs
 * @property {number|null} linkQuality Zigbee LQI (~0–150 scale)
 */

/**
 * Fixture snapshot from `GET /bulbs` / `POST /bulbs/:id`.
 *
 * @typedef {Object} LightFixtureSnapshot
 * @property {string} fixtureId
 * @property {string[]} bulbs Zigbee short addresses (first = primary)
 * @property {boolean} enabled
 * @property {LightFixtureDesiredState|null} targetState Schedule-derived target
 * @property {LightFixtureDesiredState|null} overrideState Active manual override
 * @property {number|null} overrideExpiry Epoch ms when override expires
 * @property {LightFixtureDesiredState|null} desiredState Effective target (override wins)
 * @property {Record<string, LightFixtureBulbDeviceState>} deviceStateByBulb
 * @property {number|null} lastPushAtMs
 */

/**
 * Shared poll state for all LightFixture cards on a page.
 *
 * @typedef {Object} LightFixtureFetchState
 * @property {boolean} loading True while the bulbs request is in flight.
 * @property {boolean} error True when the last poll failed.
 * @property {string} errorMsg User-facing message for the last poll error, if any.
 * @property {Record<string, LightFixtureSnapshot>} fixturesById Latest snapshot per fixtureId.
 * @property {() => Promise<void>} [refreshDashboard] Re-runs `GET /bulbs` (latest response wins if polls overlap).
 */

/** @type {import("react").Context<LightFixtureFetchState | null>} */
export const LightFixtureStateContext = createContext(null);
