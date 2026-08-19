import React, { useContext, useEffect, useState } from "react";
import Router, { useRouter } from "next/router";
import { Container, Row } from "reactstrap";

import SimpleHeader from "components/Headers/SimpleHeader.js";
import VentStateController from "components/Controllers/middleware/VentStateController.js";
import LightFixtureStateController from "components/Controllers/middleware/LightFixtureStateController.js";
import LayoutContext from "components/Layout/LayoutContext.js";
import { currentAppPath } from "components/Layout/layoutNav.js";
import {
    LayoutWidget,
    isVentWidgetType,
    isLightWidgetType,
    widgetOwnsGrid,
} from "components/Layout/widgetRegistry.js";

/**
 * @param {object} page
 * @param {(type: string) => boolean} matchType
 * @returns {boolean}
 */
function pageHasWidgetType(page, matchType) {
    const rows = Array.isArray(page?.rows) ? page.rows : [];
    return rows.some((row) => {
        const widgets = Array.isArray(row.widgets) ? row.widgets : [];
        return widgets.some((widget) => matchType(widget?.type));
    });
}

/**
 * Renders the layout page that matches the current URL path.
 *
 * @returns {import("react").ReactNode}
 */
export default function ConfigPage() {
    const { layout, layoutLoading, layoutError } = useContext(LayoutContext);
    const router = useRouter();
    const [nav, setNav] = useState({ mounted: false, path: '/' });

    useEffect(() => {
        const onChange = () => {
            setNav({ mounted: true, path: currentAppPath() });
        };
        onChange();
        router.events.on('routeChangeComplete', onChange);
        window.addEventListener('popstate', onChange);
        return () => {
            router.events.off('routeChangeComplete', onChange);
            window.removeEventListener('popstate', onChange);
        };
    }, [router]);

    useEffect(() => {
        if (!nav.mounted || layoutLoading || layoutError) {
            return;
        }
        const pages = Array.isArray(layout?.pages) ? layout.pages : [];
        const page = pages.find((p) => p.path === nav.path);
        if (!page && nav.path !== '/') {
            Router.replace('/');
        }
    }, [nav.mounted, nav.path, layoutLoading, layoutError, layout]);

    const loadingBody = (
        <>
            <SimpleHeader />
            <Container className="mt--6" fluid>
                <Row>
                    ...loading
                </Row>
            </Container>
        </>
    );

    if (!nav.mounted || layoutLoading) {
        return loadingBody;
    }

    if (layoutError) {
        return (
            <>
                <SimpleHeader />
                <Container className="mt--6" fluid>
                    <p className="text-muted mb-0">{layoutError}</p>
                </Container>
            </>
        );
    }

    const pages = Array.isArray(layout?.pages) ? layout.pages : [];
    const page = pages.find((p) => p.path === nav.path);

    if (!page) {
        return loadingBody;
    }

    const needsVent = pageHasWidgetType(page, isVentWidgetType);
    const needsLights = pageHasWidgetType(page, isLightWidgetType);

    let body = (
        <>
            {(page.rows || []).map((row, rowIndex) => {
                const widgets = Array.isArray(row.widgets) ? row.widgets : [];
                const allSelfGrid = widgets.length > 0
                    && widgets.every((widget) => widgetOwnsGrid(widget?.type));
                const children = widgets.map((widget, widgetIndex) => (
                    <LayoutWidget
                        key={'w_' + rowIndex + '_' + widgetIndex}
                        widget={widget}
                        pages={pages}
                    />
                ));
                if (allSelfGrid) {
                    return (
                        <React.Fragment key={'row_' + rowIndex}>
                            {children}
                        </React.Fragment>
                    );
                }
                return (
                    <Row
                        key={'row_' + rowIndex}
                        className={typeof row.className === 'string' ? row.className : undefined}
                    >
                        {children}
                    </Row>
                );
            })}
        </>
    );

    if (needsLights) {
        body = (
            <LightFixtureStateController>
                {body}
            </LightFixtureStateController>
        );
    }
    if (needsVent) {
        body = (
            <VentStateController>
                {body}
            </VentStateController>
        );
    }

    return (
        <>
            <SimpleHeader />
            <Container className="mt--6" fluid>
                {body}
            </Container>
        </>
    );
}
