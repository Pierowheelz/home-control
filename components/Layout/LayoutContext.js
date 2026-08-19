import React from "react";

/**
 * @typedef {{ nav?: { name?: string, icon?: string }, pages?: object[] }} AppLayout
 * @typedef {{
 *   layout: AppLayout|null,
 *   layoutLoading: boolean,
 *   layoutError: string,
 * }} LayoutContextValue
 */

/** @type {LayoutContextValue} */
const defaultValue = {
    layout: null,
    layoutLoading: true,
    layoutError: '',
};

const LayoutContext = React.createContext(defaultValue);

export default LayoutContext;
