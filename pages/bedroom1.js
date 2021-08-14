/*!
Home page / Dashboard
*/
import React, {Component} from "react";

// reactstrap components
import {
    Container,
    Row,
    Col,
} from "reactstrap";
// layout for this page
import Admin from "layouts/Admin.js";
// core components
import SimpleHeader from "components/Headers/SimpleHeader.js";
import Blinds from "components/Controllers/Blinds.js";
import Lights from "components/Controllers/Lights.js";
import Speakers from "components/Controllers/Speakers.js";

class Page extends Component {
    render(){
        return (
            <>
                <SimpleHeader />
                <Container className="mt--6" fluid>
                    <Row>
                        <Col md="6" lg="6" xl="4">
                            <Lights deviceId="10004baf3d" />
                        </Col>
                        <Col md="6" lg="6" xl="4">
                            <Blinds />
                        </Col>
                        <Col md="6" lg="6" xl="4">
                            <Speakers />
                        </Col>
                    </Row>
                </Container>
            </>
        );
    }
}

Page.layout = Admin;

export default Page;
