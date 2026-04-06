import { createContext } from "react";

/**
 * @typedef {Object} VentRoomDashboardRow
 * @property {string} room
 * @property {number|null} temperatureC
 * @property {number|null} humidity
 * @property {number|null} lastUpdateMs
 * @property {string} temperatureSource
 * @property {number} [motorId]
 * @property {string|null} [displayName]
 * @property {number|null} [pos]
 * @property {boolean} [isOpen]
 * @property {boolean|null} [wantOpen]
 * @property {boolean} [manualOverrideActive]
 * @property {number|null} [manualOverrideUntilMs]
 */

/**
 * @typedef {Object} VentDashboardStatistics
 * @property {number} [actionsLast24h]
 * @property {number} [automationActionsLast24h]
 * @property {number} [manualActionsLast24h]
 * @property {number} [failedActionsLast24h]
 */

/**
 * @typedef {Object} VentActionLogEntry
 * @property {string} id
 * @property {number} at
 * @property {'automation'|'manual'} source
 * @property {string} action
 * @property {string|number} motorId
 * @property {boolean} success
 * @property {number} [targetRaw]
 * @property {string} [roomName]
 * @property {string} [mode]
 */

/**
 * React context value pushed by VentStateController with shared vent poll
 * status for all Vent instances on the page.
 *
 * @typedef {Object} VentFetchState
 * @property {boolean} loading True while the dashboard request is in flight.
 * @property {boolean} error True when the last poll failed.
 * @property {string} errorMsg User-facing message for the last poll error, if any.
 * @property {Record<string, VentRoomDashboardRow>} roomsByMotorId Latest room row per motor id (string key).
 * @property {number|null} controllerTempC
 * @property {'idle'|'cooling'|'heating'|'unknown'|'disabled'|string} mode
 * @property {{ coolTargetC?: number, heatTargetC?: number, roomHysteresisC?: number }|null} targets
 * @property {VentActionLogEntry[]} actions Newest first.
 * @property {VentDashboardStatistics|null} statistics
 */

/** @type {import("react").Context<VentFetchState | null>} */
export const VentStateContext = createContext(null);
