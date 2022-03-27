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
import Lights from "components/Controllers/Lights.js";
import Vent from "components/Controllers/Vent.js";

class Page extends Component {
    render(){
        return (
            <>
                <SimpleHeader />
                <Container className="mt--6" fluid>
                    <Row>
                        <Col md="6" lg="6" xl="4">
                            <Lights deviceId="10004bae5e" />
                        </Col>
                        <Col md="6" lg="6" xl="4">
                            <Vent deviceId="1" title="AC Vent" />
                        </Col>
                    </Row>
                </Container>
            </>
        );
    }
}

Page.layout = Admin;

export default Page;
