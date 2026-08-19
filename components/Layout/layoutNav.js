import {
    faTachometer,
    faBedEmpty,
    faGarage,
    faBlinds,
    faServer,
    faWind,
    faLightbulb,
} from '@fortawesome/pro-light-svg-icons';

/** @type {Record<string, import('@fortawesome/fontawesome-svg-core').IconDefinition>} */
const LAYOUT_ICONS = {
    tachometer: faTachometer,
    bedEmpty: faBedEmpty,
    garage: faGarage,
    blinds: faBlinds,
    server: faServer,
    wind: faWind,
    lightbulb: faLightbulb,
};

/**
 * Font Awesome icon for a layout config icon key.
 *
 * @param {string} [key]
 * @returns {import('@fortawesome/fontawesome-svg-core').IconDefinition}
 */
export function iconFromKey(key) {
    if (typeof key === 'string' && LAYOUT_ICONS[key]) {
        return LAYOUT_ICONS[key];
    }
    return faTachometer;
}

/**
 * Next.js Link / Router targets for a layout page path.
 * Catch-all slugs use href `/[page]` with a pretty `as` URL.
 *
 * @param {string} path
 * @returns {{ href: string, as?: string }}
 */
export function pageHref(path) {
    const normalized = !path || path === '/'
        ? '/'
        : (path.startsWith('/') ? path : '/' + path);
    if (normalized === '/') {
        return { href: '/' };
    }
    return { href: '/[page]', as: normalized };
}

/**
 * Pathname used to look up a layout page (Apache may serve catch-all HTML).
 *
 * @returns {string}
 */
export function currentAppPath() {
    if (typeof window === 'undefined') {
        return '/';
    }
    let path = window.location.pathname || '/';
    if (path === '/_' || path === '/_.html') {
        return '/';
    }
    if (path.endsWith('.html')) {
        path = path.slice(0, -5);
    }
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return path || '/';
}
