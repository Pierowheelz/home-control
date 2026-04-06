/*!
 * Renders read-only sensor tiles for dashboard rooms without a vent motor.
 */
import React from "react";
import PropTypes from "prop-types";
import { Row, Col } from "reactstrap";

import { VentStateContext } from "components/Controllers/middleware/VentStateContext.js";
import VentSensorRoomCardInner from "components/Controllers/VentSensorRoom.js";

/**
 * @param {import("components/Controllers/middleware/VentStateContext.js").VentFetchState|null} ventFetch
 * @returns {import("react").ReactNode}
 */
function VentSensorOnlyRoomsInner({ ventFetch }) {
    const raw = ventFetch?.sensorOnlyRooms;
    if (!Array.isArray(raw) || raw.length === 0) {
        return null;
    }
    const rooms = [...raw].sort((a, b) => {
        const ka =
            typeof a?.room === "string" ? a.room.toLowerCase() : "";
        const kb =
            typeof b?.room === "string" ? b.room.toLowerCase() : "";
        return ka.localeCompare(kb);
    });

    return (
        <Row className="mt-4">
            {rooms.map((row, idx) => (
                <Col
                    key={`${typeof row.room === "string" ? row.room : "room"}-${idx}`}
                    sm="12"
                    md="6"
                    lg="4"
                    xl="4"
                >
                    <VentSensorRoomCardInner roomRow={row} />
                </Col>
            ))}
        </Row>
    );
}

VentSensorOnlyRoomsInner.propTypes = {
    ventFetch: PropTypes.object,
};

VentSensorOnlyRoomsInner.defaultProps = {
    ventFetch: null,
};

export default class VentSensorOnlyRooms extends React.Component {
    render() {
        return (
            <VentStateContext.Consumer>
                {(ventFetch) => (
                    <VentSensorOnlyRoomsInner ventFetch={ventFetch} />
                )}
            </VentStateContext.Consumer>
        );
    }
}
