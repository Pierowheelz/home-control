/*!
 * Catch-all layout page. Pretty URLs are rewritten here by Apache.
 */
import React from "react";

import Admin from "layouts/Admin.js";
import ConfigPage from "components/Layout/ConfigPage.js";

/**
 * @returns {import("react").ReactNode}
 */
function CatchAllPage() {
    return <ConfigPage />;
}

CatchAllPage.layout = Admin;

export default CatchAllPage;

/**
 * Dummy slug so `next export` emits catch-all HTML for Apache rewrites.
 *
 * @returns {{ paths: { params: { page: string } }[], fallback: boolean }}
 */
export async function getStaticPaths() {
    return {
        paths: [{ params: { page: '_' } }],
        // next export does not support fallback; next dev needs it for arbitrary slugs
        fallback: process.env.NODE_ENV === 'development',
    };
}

/**
 * @returns {{ props: object }}
 */
export async function getStaticProps() {
    return { props: {} };
}
