/*!
=========================================================
* Navigation bar (header) for Admin (dashboard) pages
=========================================================
*/
import React, { useContext } from "react";
import { useRouter } from 'next/router';
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
//classes
import WbSession from "classes/Session.jsx";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSearchPlus, faBell, faChevronDown } from '@fortawesome/pro-light-svg-icons';

function AdminNavbar({ theme, sidenavOpen, toggleSidenav }) {
    const router = useRouter();
    const session = useContext( WbSession );
    
    const [userData, setUserData] = React.useState(0);
    const [gettingData, setGettingData] = React.useState(0);
    
    //get User data from server
    const fetchUserDetails = async () => {
        console.log('Fetching user profile data for AdminNavbar.');
        const remoteData = await session.getProfile();
        console.log('Got user profile data for AdminNavbar.', remoteData);
        setUserData(remoteData);
    };
    
    if( !gettingData ){
        fetchUserDetails();
        setGettingData(true);
    }

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
                    <Nav className="align-items-left" navbar>
                        <NavItem className="d-xl-none">
                            <div
                                className={classnames(
                                    "pr-3 sidenav-toggler",
                                    { active: sidenavOpen },
                                    { "sidenav-toggler-dark": theme === "dark" }
                                )}
                                onClick={toggleSidenav}
                            >
                                <div className="sidenav-toggler-inner">
                                    <i className="sidenav-toggler-line" />
                                    <i className="sidenav-toggler-line" />
                                    <i className="sidenav-toggler-line" />
                                </div>
                            </div>
                        </NavItem>
                    </Nav>
                    <div className="align-items-center ml-md-auto ml-md-0" navbar>
                        <Media className="align-items-center">
                            <span className="avatar avatar-sm rounded-circle">
                                <img
                                    alt="..."
                                    src={require("assets/img/theme/profile.png")}
                                />
                            </span>
                            <Media className="ml-2 d-none d-lg-block">
                                <span className="mb-0 text-sm font-weight-bold">
                                    {userData.firstName ? (userData.firstName+" "+userData.lastName) : '...'}
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
