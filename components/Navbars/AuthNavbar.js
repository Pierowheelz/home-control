/*!

=========================================================
* Navigation bar (header) for Auth (not logged in) pages
=========================================================

*/
import React from "react";
// nodejs library that concatenates classes
import classnames from "classnames";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// reactstrap components
import {
    Collapse,
    DropdownMenu,
    DropdownItem,
    UncontrolledDropdown,
    DropdownToggle,
    FormGroup,
    Form,
    Input,
    InputGroupAddon,
    InputGroupText,
    InputGroup,
    ListGroupItem,
    ListGroup,
    Media,
    Navbar,
    NavItem,
    NavLink,
    Nav,
    Container,
    Row,
    Col,
} from "reactstrap";

import Link from 'next/link'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faSearchPlus, faBell, faChevronDown } from '@fortawesome/pro-light-svg-icons'

function AdminNavbar({ theme, sidenavOpen, toggleSidenav }) {

    return (
        <>
            <Navbar
                className={classnames(
                    "navbar-top navbar-expand border-bottom",
                    { "navbar-dark bg-dark": theme === "dark" },
                    { "navbar-light bg-secondary": theme === "light" }
                )}
            >
                <Container fluid>
                    <div className="align-items-center ml-md-auto ml-md-0" navbar>
                        <Media className="align-items-center">
                            <span className="avatar avatar-sm rounded-circle">
                                        <Link href="/auth/login">
                                                <img
                                                alt="..."
                                                src={require("assets/img/theme/profile.png")}
                                                />
                                        </Link>
                                </span>
                                <Media className="ml-2 d-none d-lg-block">
                                    <span className="mb-0 text-sm font-weight-bold">
                                            <Link href="/auth/login">
                                                Log In
                                            </Link>
                                    </span>
                                </Media>
                        </Media>
                    </div>
                </Container>
            </Navbar>
        </>
    );
}

AdminNavbar.defaultProps = {
    toggleSidenav: () => {},
    sidenavOpen: false,
    theme: "dark",
};
AdminNavbar.propTypes = {
    toggleSidenav: PropTypes.func,
    sidenavOpen: PropTypes.bool,
    theme: PropTypes.oneOf(["dark", "light"]),
};

export default AdminNavbar;
