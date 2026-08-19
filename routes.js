/*!

* This file outlines routes (used to generate Sidebar links).
*     NOTE: pretty URLs come from backend appLayout; catch-all is pages/[page].js.

*/
import { iconFromKey } from "components/Layout/layoutNav.js";

/**
 * Sidebar route tree from a GET /layout payload.
 *
 * @param {{ nav?: { name?: string, icon?: string }, pages?: object[] }|null} layout
 * @returns {object[]}
 */
const getAppRoutes = ( layout ) => {
    const pages = Array.isArray(layout?.pages) ? layout.pages : [];
    const dashboardViews = pages
        .filter((page) => page.showInNav)
        .map((page) => ({
            path: typeof page.path === 'string' ? page.path : '/' + page.id,
            name: page.navName || page.id,
            miniName: page.miniName || '',
            layout: "",
        }));

    const navName = typeof layout?.nav?.name === 'string'
        ? layout.nav.name
        : 'Dashboards';

    return [
        {
            collapse: true,
            name: navName,
            icon: iconFromKey(layout?.nav?.icon),
            state: "dashboardsCollapse",
            noUser: true,
            views: dashboardViews,
        }
    ];
};

export default getAppRoutes;
