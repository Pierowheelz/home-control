/*!
 * Home page / Dashboard (contents from GET /layout)
 */
import React from "react";

import Admin from "layouts/Admin.js";
import ConfigPage from "components/Layout/ConfigPage.js";

function HomePage() {
    return <ConfigPage />;
}

HomePage.layout = Admin;

export default HomePage;
