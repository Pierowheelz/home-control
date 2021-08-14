/*!
=========================================================
* Header used on all pages (except login, password reset, profile).
=========================================================
*/
import React, { useContext } from "react";
import Link from 'next/link';

// reactstrap components
import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Container,
    Row,
    Col,
} from "reactstrap";
//classes
import WbSession from "classes/Session.jsx";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/pro-solid-svg-icons';

function SimpleHeader() {
    const session = useContext( WbSession );
    
    return (
        <>
            <div className="header pb-6">
                <Container fluid>
                    <div className="header-body">
                        <Row className="align-items-center py-4">
                            <Col lg="6" xs="7">
                                <Breadcrumb
                                    className="d-none d-md-inline-block ml-md-4"
                                    listClassName="breadcrumb-links"
                                >
                                    <BreadcrumbItem>
                                        <Link href="/">
                                            <FontAwesomeIcon className="menuIcon" icon={faHome} />
                                        </Link>
                                    </BreadcrumbItem>
                                    <BreadcrumbItem>
                                        <Link href="/">
                                            Dashboard
                                        </Link>
                                    </BreadcrumbItem>
                                </Breadcrumb>
                            </Col>
                            <Col className="text-right" lg="6" xs="5">
                                
                            </Col>
                        </Row>
                    </div>
                </Container>
            </div>
        </>
    );
}

export default SimpleHeader;
