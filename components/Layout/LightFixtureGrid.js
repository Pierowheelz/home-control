import React from "react";
import { Row, Col } from "reactstrap";

import LightFixture from "components/Controllers/LightFixture.js";
import { LightFixtureStateContext } from "components/Controllers/middleware/LightFixtureStateContext.js";

/**
 * Humanize a fixtureId when no title map entry exists.
 *
 * @param {string} fixtureId
 * @param {Record<string, string>} [titles]
 * @returns {string}
 */
export function titleForFixtureId(fixtureId, titles) {
    if (
        titles &&
        Object.prototype.hasOwnProperty.call(titles, fixtureId) &&
        titles[fixtureId]
    ) {
        return titles[fixtureId];
    }
    if (!fixtureId) {
        return "Light";
    }
    return fixtureId.charAt(0).toUpperCase() + fixtureId.slice(1);
}

/**
 * Renders one card per fixture from the shared poll context.
 *
 * @param {{ titles?: Record<string, string> }} props
 * @returns {import("react").ReactNode}
 */
export default function LightFixtureGrid({ titles }) {
    return (
        <LightFixtureStateContext.Consumer>
            {(fetchState) => {
                const fixturesById = fetchState?.fixturesById ?? {};
                const ids = Object.keys(fixturesById).sort();
                if (ids.length === 0) {
                    return (
                        <Row>
                            <Col sm="12">
                                <p className="text-muted mb-0">
                                    {fetchState?.loading
                                        ? "Loading fixtures…"
                                        : fetchState?.error
                                          ? fetchState.errorMsg ||
                                            "Failed to load fixtures."
                                          : "No light fixtures configured."}
                                </p>
                            </Col>
                        </Row>
                    );
                }
                return (
                    <Row>
                        {ids.map((fixtureId) => (
                            <Col
                                key={fixtureId}
                                sm="12"
                                md="4"
                                lg="4"
                                xl="4"
                                className="mb-4"
                            >
                                <LightFixture
                                    fixtureId={fixtureId}
                                    title={titleForFixtureId(fixtureId, titles)}
                                />
                            </Col>
                        ))}
                    </Row>
                );
            }}
        </LightFixtureStateContext.Consumer>
    );
}
