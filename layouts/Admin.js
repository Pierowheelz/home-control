/*!

=========================================================
* Layout for all pages (except when user is logged-out)
=========================================================

*/
import React, {useContext} from "react";
import { withRouter } from "next/router";
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from 'reactstrap';
// core components
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import Footer from "components/Footers/Footer.js";
import Sidebar from "components/Sidebar/Sidebar.js";
import getAppRoutes from "routes.js";
//classes
import WbSession from "classes/Session.jsx";
import LayoutContext from "components/Layout/LayoutContext.js";
import { currentAppPath } from "components/Layout/layoutNav.js";

//import Routes from "routes.js";

function Admin({ router, children }) {
    const session = useContext( WbSession );
    
    const [sessionValid, setSessionValididy] = React.useState(true);
    const [sessionErrorMsg, setSessionErrorMsg] = React.useState('');
    const [redirectToLogin, enableRedirectToLogin] = React.useState(false);
    // Defer client-only session/window reads until after mount (SSR hydration)
    const [mounted, setMounted] = React.useState(false);
    const [sidenavOpen, setSidenavOpen] = React.useState(false);
    const cachedLayout = session.getCachedLayout ? session.getCachedLayout() : null;
    const [layout, setLayout] = React.useState(cachedLayout);
    const [layoutLoading, setLayoutLoading] = React.useState(!cachedLayout);
    const [layoutError, setLayoutError] = React.useState('');

    React.useEffect(() => {
        setMounted(true);
        // Open by default on tablet/desktop after mount
        if (window.innerWidth > 768) {
            document.body.classList.add("g-sidenav-pinned");
            document.body.classList.add("g-sidenav-show");
            document.body.classList.remove("g-sidenav-hidden");
            setSidenavOpen(true);
        }
    }, []);

    // Redirect after mount so SSR HTML matches the first client render
    React.useEffect(() => {
        if (!mounted) {
            return;
        }
        if (redirectToLogin || !session.isLoggedIn()) {
            session.logout();
            router.push({pathname: '/auth/login'});
        }
    }, [mounted, redirectToLogin]);

    React.useEffect(() => {
        if (!mounted || !session.isLoggedIn()) {
            return;
        }
        let cancelled = false;
        session.getLayout().then((data) => {
            if (cancelled) {
                return;
            }
            if (data && Array.isArray(data.pages)) {
                setLayout(data);
                setLayoutError('');
            } else {
                setLayoutError(
                    (data && (data.message || data.error)) || 'Failed to load layout.'
                );
            }
            setLayoutLoading(false);
        }).catch(() => {
            if (!cancelled) {
                setLayoutError('Failed to load layout.');
                setLayoutLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [mounted]);
    
    // Setup action upon user logged-out
    const onSessionExpiry = ( msg ) => {
        // Triggered when user is logged out by server
        console.log('user session expired');
        setSessionValididy( false );
        setSessionErrorMsg( msg );
    };
    session.passControllerErrorFunction( onSessionExpiry );
    
    // Handle Login redirect (by button on session error popup)
    const triggerLoginRedirect = () => {
        enableRedirectToLogin( true );
    };

    // null userId until mounted — matches SSR (no localStorage session yet)
    const routes = getAppRoutes(layout);
    
    const getRoutes = ( routes ) => {
        if( typeof routes == "undefined" ){
            var routes = getAppRoutes(layout);
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
        const pages = Array.isArray(layout?.pages) ? layout.pages : [];
        const match = pages.find((page) => page.path === path);
        if (match) {
            return match.navName || match.id;
        }
        return "Brand";
    };
    // toggles collapse between mini sidenav and normal
    const toggleSidenav = (e) => {
        if (document.body.classList.contains("g-sidenav-pinned")) {
            document.body.classList.remove("g-sidenav-pinned");
            document.body.classList.remove("g-sidenav-show");
            document.body.classList.add("g-sidenav-hidden");
        } else {
            document.body.classList.add("g-sidenav-pinned");
            document.body.classList.add("g-sidenav-show");
            document.body.classList.remove("g-sidenav-hidden");
        }
        setSidenavOpen(!sidenavOpen);
    };
    const getNavbarTheme = () => {
        return router.pathname.indexOf("admin/alternative-dashboard") === -1
            ? "dark"
            : "light";
    };
    
    console.log('sidebar state: ', sidenavOpen);
    const brandPath = mounted ? currentAppPath() : router.pathname;
    return (
        <LayoutContext.Provider value={{ layout, layoutLoading, layoutError }}>
            <Sidebar
                routes={routes}
                toggleSidenav={toggleSidenav}
                sidenavOpen={sidenavOpen}
            />
            <div className="main-content">
                <AdminNavbar
                    theme={getNavbarTheme()}
                    toggleSidenav={toggleSidenav}
                    sidenavOpen={sidenavOpen}
                    brandText={getBrandText(brandPath)}
                />
                {children}
                <Footer />
            </div>
            {sidenavOpen ? (
                <div className="backdrop d-xl-none" onClick={toggleSidenav} />
            ) : null}
            <Modal isOpen={!sessionValid} className="">
                <ModalHeader>Session error.</ModalHeader>
                <ModalBody>
                    {sessionErrorMsg}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={triggerLoginRedirect}>Log In</Button>{' '}
                </ModalFooter>
            </Modal>
        </LayoutContext.Provider>
    );
}

export default withRouter(Admin);
