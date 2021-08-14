/*!

=========================================================
* Layout for Auth pages (user not logged in)
=========================================================

*/
import React from "react";
import { withRouter } from "next/router";
// core components
import AuthNavbar from "components/Navbars/AuthNavbar.js";
import Footer from "components/Footers/Footer.js";
import Sidebar from "components/Sidebar/Sidebar.js";
import getAppRoutes from "routes.js";

function Auth({ router, children }) {
    const [sidenavOpen, setSidenavOpen] = React.useState(false);
    const getRoutes = (routes) => {
        if( typeof routes == "undefined" ){
            var routes = getAppRoutes(-1);
        }
        return routes.map((prop, key) => {
            if (prop.collapse) {
                return getRoutes(prop.views);
            }
            if (prop.layout === "/admin") {
                return (
                    <Route
                        path={prop.layout + prop.path}
                        component={prop.component}
                        key={key}
                    />
                );
            } else {
                return null;
            }
        });
    };
    const getBrandText = (path) => {
        const routes = getAppRoutes(-1);
        for (let i = 0; i < routes.length; i++) {
            if (router.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
                return routes[i].name;
            }
        }
        return "Brand";
    };
    // toggles collapse between mini sidenav and normal
    const toggleSidenav = (e) => {
        if (document.body.classList.contains("g-sidenav-pinned")) {
            document.body.classList.remove("g-sidenav-pinned");
            document.body.classList.add("g-sidenav-hidden");
        } else {
            document.body.classList.add("g-sidenav-pinned");
            document.body.classList.remove("g-sidenav-hidden");
        }
        setSidenavOpen(!sidenavOpen);
    };
    const getNavbarTheme = () => {
        return router.pathname.indexOf("admin/alternative-dashboard") === -1
            ? "dark"
            : "light";
    };
    return (
        <>
            <Sidebar
                routes={getAppRoutes(-1)}
                toggleSidenav={toggleSidenav}
                sidenavOpen={sidenavOpen}
            />
            <div className="main-content">
                <AuthNavbar
                    theme={getNavbarTheme()}
                    toggleSidenav={toggleSidenav}
                    sidenavOpen={sidenavOpen}
                    brandText={getBrandText(router.pathname)}
                />
                {children}
                <Footer />
            </div>
            {sidenavOpen ? (
                <div className="backdrop d-xl-none" onClick={toggleSidenav} />
            ) : null}
        </>
    );
}

export default withRouter(Auth);
