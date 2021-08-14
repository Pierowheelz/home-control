/*!

=========================================================
* Footer
=========================================================

*/
import React, { useContext } from "react";
import { useRouter } from 'next/router';

// reactstrap components
import { NavItem, NavLink, Nav, Container, Row, Col } from "reactstrap";
//classes
import WbSession from "classes/Session.jsx";

function Footer() {
    const router = useRouter();
    const session = useContext( WbSession );
    
    return (
        <>
            <Container fluid>
                <footer className="footer pt-0">
                    <Row className="align-items-center justify-content-lg-between">
                        <Col lg="6">
                            <div className="copyright text-center text-lg-left text-muted">
                                Home Controller
                            </div>
                        </Col>
                        <Col lg="6">
                            <Nav className="nav-footer justify-content-center justify-content-lg-end">
                                <NavItem>
                                    <NavLink
                                        href="#"
                                    >
                                        App by Peter Wells
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        onClick={(e)=>{
                                            e.preventDefault();
                                            session.logout();
                                            router.push('/auth/login');
                                        }}
                                    >
                                        Logout
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </Col>
                    </Row>
                </footer>
            </Container>
        </>
    );
}

export default Footer;
