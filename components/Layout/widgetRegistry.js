import React from "react";
import Router from "next/router";
import { Col } from "reactstrap";

import LinkCard from "components/Features/LinkCard.jsx";
import Vent from "components/Controllers/Vent.js";
import VentControllerCard from "components/Controllers/VentControllerCard.js";
import VentSensorOnlyRooms from "components/Controllers/VentSensorOnlyRooms.js";
import Speakers from "components/Controllers/Speakers.js";
import GarageDoor from "components/Controllers/GarageDoor.js";
import Blinds from "components/Controllers/Blinds.js";
import Server from "components/Controllers/Server.js";
import LightFixtureGrid from "components/Layout/LightFixtureGrid.js";
import { iconFromKey, pageHref } from "components/Layout/layoutNav.js";

/** Widget types that render their own Bootstrap row/grid. */
const SELF_GRID_TYPES = {
    ventSensorRooms: true,
    lightFixtures: true,
};

/**
 * @param {object} col
 * @returns {{ sm?: number|string, md?: number|string, lg?: number|string, xl?: number|string }}
 */
function colProps(col) {
    const src = col && typeof col === 'object' ? col : {};
    const props = {};
    ['sm', 'md', 'lg', 'xl'].forEach((key) => {
        if (src[key] != null) {
            props[key] = src[key];
        }
    });
    return props;
}

/**
 * Dashboard tile that navigates to another layout page.
 *
 * @param {{ widget: object, pages: object[] }} props
 * @returns {import("react").ReactNode}
 */
function PageLinkWidget({ widget, pages }) {
    const target = (pages || []).find((page) => page.id === widget.pageId);
    const path = target && typeof target.path === 'string'
        ? target.path
        : '/' + (widget.pageId || '');
    const href = pageHref(path);
    const color = typeof widget.color === 'string' ? widget.color : 'default';

    const redirectToPage = () => {
        if (href.as) {
            Router.push(href.href, href.as);
        } else {
            Router.push(href.href);
        }
    };

    return (
        <Col
            id={'col_' + (widget.pageId || '')}
            {...colProps(widget.col)}
            onClick={redirectToPage}
        >
            <LinkCard
                id={'card_' + (widget.pageId || '')}
                title={widget.title || target?.navName || widget.pageId}
                button={widget.button || 'Open'}
                icon={iconFromKey(widget.icon)}
                className={'bg-gradient-' + color}
            />
        </Col>
    );
}

/**
 * Inner widget for a layout `type` (without column wrapper).
 *
 * @param {{ widget: object, pages: object[] }} props
 * @returns {import("react").ReactNode}
 */
function WidgetInner({ widget, pages }) {
    switch (widget.type) {
        case 'pageLink':
            return <PageLinkWidget widget={widget} pages={pages} />;
        case 'vent':
            return (
                <Vent
                    deviceId={String(widget.deviceId)}
                    title={widget.title || 'Vent'}
                />
            );
        case 'ventController':
            return <VentControllerCard />;
        case 'ventSensorRooms':
            return <VentSensorOnlyRooms />;
        case 'lightFixtures':
            return <LightFixtureGrid titles={widget.titles} />;
        case 'speakers':
            return <Speakers />;
        case 'garage':
            return <GarageDoor />;
        case 'blinds':
            return <Blinds />;
        case 'server':
            return <Server />;
        default:
            return null;
    }
}

/**
 * @param {string} type
 * @returns {boolean}
 */
export function widgetOwnsGrid(type) {
    return SELF_GRID_TYPES[type] === true;
}

/**
 * @param {string} type
 * @returns {boolean}
 */
export function isVentWidgetType(type) {
    return type === 'vent' || type === 'ventController' || type === 'ventSensorRooms';
}

/**
 * @param {string} type
 * @returns {boolean}
 */
export function isLightWidgetType(type) {
    return type === 'lightFixtures';
}

/**
 * Render one layout widget, wrapping in a Col unless it owns its own grid
 * or is already a Col (pageLink).
 *
 * @param {{ widget: object, pages: object[], key: string }} props
 * @returns {import("react").ReactNode}
 */
export function LayoutWidget({ widget, pages }) {
    if (!widget || typeof widget.type !== 'string') {
        return null;
    }
    if (widget.type === 'pageLink') {
        return <PageLinkWidget widget={widget} pages={pages} />;
    }
    if (widgetOwnsGrid(widget.type)) {
        return <WidgetInner widget={widget} pages={pages} />;
    }
    return (
        <Col {...colProps(widget.col)}>
            <WidgetInner widget={widget} pages={pages} />
        </Col>
    );
}
