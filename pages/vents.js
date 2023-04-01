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
import Vent from "components/Controllers/Vent.js";

class Page extends Component {
    render(){
        return (
            <>
                <SimpleHeader />
                <Container className="mt--6" fluid>
                    <Row>
                        <Col sm="12" md="4" lg="4" xl="4">
                            <Vent deviceId="0" title="Peter's Room" />
                        </Col>
                        <Col sm="12" md="4" lg="4" xl="4">
                            <Vent deviceId="1" title="Burton's Room" doesRefresh={ false } />
                        </Col>
                        <Col sm="12" md="4" lg="4" xl="4">
                            <Vent deviceId="2" title="Guest Room" doesRefresh={ false } />
                        </Col>
                    </Row>
                </Container>
            </>
        );
    }
}

Page.layout = Admin;

export default Page;
