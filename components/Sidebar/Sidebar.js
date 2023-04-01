/*!

=========================================================
* Navigation sidebar (items managed from routes.js)
=========================================================

*/
import React, { useContext } from "react";
import Link from "next/link";
import { withRouter } from "next/router";
// nodejs library that concatenates classes
import classnames from "classnames";
// nodejs library to set properties for components
import { PropTypes } from "prop-types";
// react library that creates nice scrollbar on windows devices
import PerfectScrollbar from "react-perfect-scrollbar";
// reactstrap components
import {
    Collapse,
    NavbarBrand,
    Navbar,
    NavItem,
    NavLink,
    Nav,
} from "reactstrap";
//classes
import WbSession from "classes/Session.jsx";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleRight } from '@fortawesome/pro-light-svg-icons';

function Sidebar({
    toggleSidenav,
    sidenavOpen,
    routes,
    logo,
    rtlActive,
    router,
}) {
    const [state, setState] = React.useState({});
    const [windowWidth, setWindowWidth] = React.useState(0);
    const [navigatorPlatform, setNavigatorPlatform] = React.useState("");
    const session = useContext( WbSession );
    React.useEffect(() => {
        setState(getCollapseStates(routes));
        setWindowWidth(window.innerWidth);
        setNavigatorPlatform(navigator.platform);
        // eslint-disable-next-line
    }, []);
    // verifies if routeName is the one active (in browser input)
    const activeRoute = (routeName) => {
        return router.pathname.indexOf(routeName) > -1 ? "active" : "";
    };
    // this creates the intial state of this component based on the collapse routes
    // that it gets through props.routes
    const getCollapseStates = (routes) => {
        let initialState = {};
        routes.map((prop, key) => {
            if (prop.collapse) {
                initialState = {
                    [prop.state]: getCollapseInitialState(prop.views),
                    ...getCollapseStates(prop.views),
                    ...initialState,
                };
            }
            return null;
        });
        return initialState;
    };
    // this verifies if any of the collapses should be default opened on a rerender of this component
    // for example, on the refresh of the page,
    // while on the src/views/forms/RegularForms.js - route /admin/regular-forms
    const getCollapseInitialState = (routes) => {
        for (let i = 0; i < routes.length; i++) {
            if (routes[i].collapse && getCollapseInitialState(routes[i].views)) {
                return true;
            } else if (router.pathname.indexOf(routes[i].path) !== -1) {
                return true;
            }
        }
        return false;
    };
    // this is used on mobile devices, when a user navigates
    // the sidebar will autoclose
    const closeSidenav = () => {
        if (windowWidth < 1200) {
            toggleSidenav();
        }
    };
    // this function creates the links and collapses that appear in the sidebar (left menu)
    const createLinks = (routes) => {
        return routes.map((prop, key) => {
            if (prop.redirect) {
                return null;
            }
            if( !prop.noUser && !session.isLoggedIn() ){
                return null; //hide this menu item if not logged in
            }
            if (prop.collapse) {
                var st = {};
                st[prop["state"]] = !state[prop.state];
                return (
                    <NavItem key={key}>
                        <NavLink
                            href="#link"
                            data-toggle="collapse"
                            aria-expanded={state[prop.state]}
                            className={classnames({
                                active: getCollapseInitialState(prop.views),
                            })}
                            onClick={(e) => {
                                e.preventDefault();
                                setState(st);
                            }}
                        >
                            {prop.icon ? (
                                <>
                                    <FontAwesomeIcon className="menuIcon" icon={prop.icon} />
                                    <span className="nav-link-text">{prop.name}</span>
                                </>
                            ) : prop.miniName ? (
                                <>
                                    <span className="sidenav-mini-icon"> {prop.miniName} </span>
                                    <span className="sidenav-normal"> {prop.name} </span>
                                </>
                            ) : null}
                            <FontAwesomeIcon className="toggleIcon" icon={faAngleRight} />
                        </NavLink>
                        <Collapse isOpen={state[prop.state]}>
                            <Nav className="nav-sm flex-column">
                                {createLinks(prop.views)}
                            </Nav>
                        </Collapse>
                    </NavItem>
                );
            }
            return (
                <NavItem className={activeRoute(prop.layout + prop.path)} key={key}>
                    <Link href={prop.layout + prop.path}><NavLink href="#link" onClick={closeSidenav}>
                            {prop.icon !== undefined ? (
                                <>
                                    <FontAwesomeIcon className="menuIcon" icon={prop.icon} />
                                    <span className="nav-link-text">{prop.name}</span>
                                </>
                            ) : prop.miniName !== undefined ? (
                                <>
                                    <span className="sidenav-mini-icon"> {prop.miniName} </span>
                                    <span className="sidenav-normal"> {prop.name} </span>
                                </>
                            ) : (
                                prop.name
                            )}
                        </NavLink></Link>
                </NavItem>
            );
        });
    };
    const scrollBarInner = (
        <div className="scrollbar-inner">
            <div className="sidenav-header d-flex align-items-center">
                {logo && logo.innerLink ? (
                    <Link href={logo.innerLink}>
                        <span>
                            <NavbarBrand href="#link">
                                <img
                                    alt={logo.imgAlt}
                                    className="navbar-brand-img"
                                    src={logo.imgSrc}
                                />
                            </NavbarBrand>
                        </span>
                    </Link>
                ) : null}
                {logo && logo.outterLink ? (
                    <NavbarBrand href={logo.outterLink} target="_blank">
                        <img
                            alt={logo.imgAlt}
                            className="navbar-brand-img"
                            src={logo.imgSrc}
                        />
                    </NavbarBrand>
                ) : null}
                <div className="ml-auto">
                    <div
                        className={classnames("sidenav-toggler d-none d-xl-block", {
                            active: sidenavOpen,
                        })}
                        onClick={toggleSidenav}
                    >
                        <div className="sidenav-toggler-inner">
                            <i className="sidenav-toggler-line" />
                            <i className="sidenav-toggler-line" />
                            <i className="sidenav-toggler-line" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="navbar-inner">
                <Collapse navbar isOpen={true}>
                    <Nav navbar>{createLinks(routes)}</Nav>
                </Collapse>
            </div>
        </div>
    );
    return (
        <Navbar
            className="sidenav navbar-vertical navbar-expand-xs navbar-light bg-white fixed-left"
        >
            {navigatorPlatform && navigatorPlatform.indexOf("Win") > -1 ? (
                <PerfectScrollbar>{scrollBarInner}</PerfectScrollbar>
            ) : (
                scrollBarInner
            )}
        </Navbar>
    );
}

Sidebar.defaultProps = {
    routes: [{}],
    toggleSidenav: () => {},
    sidenavOpen: false,
    rtlActive: false,
};

Sidebar.propTypes = {
    // function used to make sidenav mini or normal
    toggleSidenav: PropTypes.func,
    // prop to know if the sidenav is mini or normal
    sidenavOpen: PropTypes.bool,
    // links that will be displayed inside the component
    routes: PropTypes.arrayOf(PropTypes.object),
    // logo
    logo: PropTypes.shape({
        // innerLink is for links that will direct the user within the app
        // it will be rendered as <Link to="...">...</Link> tag
        innerLink: PropTypes.string,
        // outterLink is for links that will direct the user outside the app
        // it will be rendered as simple <a href="...">...</a> tag
        outterLink: PropTypes.string,
        // the image src of the logo
        imgSrc: PropTypes.string.isRequired,
        // the alt for the img
        imgAlt: PropTypes.string.isRequired,
    }),
    // rtl active, this will make the sidebar to stay on the right side
    rtlActive: PropTypes.bool,
};

export default withRouter(Sidebar);
