import React from "react";

/**
 * @typedef {{ nav?: { name?: string, icon?: string }, pages?: object[] }} AppLayout
 * @typedef {{
 *   layout: AppLayout|null,
 *   layoutLoading: boolean,
 *   layoutError: string,
 *   reloadLayout: () => Promise<AppLayout|false>,
 * }} LayoutContextValue
 */

/** @type {LayoutContextValue} */
const defaultValue = {
    layout: null,
    layoutLoading: true,
    layoutError: '',
    reloadLayout: async () => false,
};

const LayoutContext = React.createContext(defaultValue);

export default LayoutContext;
