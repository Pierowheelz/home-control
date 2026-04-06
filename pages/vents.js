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
import Vent from "components/Controllers/Vent.js";
import VentControllerCard from "components/Controllers/VentControllerCard.js";
import VentSensorOnlyRooms from "components/Controllers/VentSensorOnlyRooms.js";
import VentStateController from "components/Controllers/middleware/VentStateController.js";

class Page extends Component {
    render(){
        return (
            <>
                <SimpleHeader />
                <Container className="mt--6" fluid>
                    <VentStateController>
                    <Row>
                        <Col sm="12" md="4" lg="4" xl="4">
                            <Vent deviceId="0" title="Peter's Room" />
                        </Col>
                        <Col sm="12" md="4" lg="4" xl="4">
                            <Vent deviceId="1" title="Burton's Room" />
                        </Col>
                        <Col sm="12" md="4" lg="4" xl="4">
                            <Vent deviceId="2" title="Guest Room" />
                        </Col>
                    </Row>
                    <Row className="mt-4">
                        <Col sm="12">
                            <VentControllerCard />
                        </Col>
                    </Row>
                    <VentSensorOnlyRooms />
                    </VentStateController>
                </Container>
            </>
        );
    }
}

Page.layout = Admin;

export default Page;
