/*!
Home page / Dashboard
*/
import React, {Component} from "react";
import Router from 'next/router';

// reactstrap components
import {
    Container,
    Row,
    Col,
} from "reactstrap";
// layout for this page
import Admin from "layouts/Admin.js";
//classes
import WbSession from "classes/Session.jsx";
// core components
import SimpleHeader from "components/Headers/SimpleHeader.js";
import LinkCard from "components/Features/LinkCard.jsx";

import { faBedEmpty, faGarage, faBlinds, faComputerSpeaker } from '@fortawesome/pro-light-svg-icons';

class HomePage extends Component {
    static contextType = WbSession;
    
    redirectToPage = ( page ) => {
        Router.push(
            {
                pathname: page
            }
        );
    };
    
    render(){
        //console.log( "User ID: ", this.context.getUserId() );
        
        return (
            <>
                <SimpleHeader />
                <Container className="mt--6" fluid>
                    <Row>
                        <Col key="0" md="6" xl="3" onClick={() => {this.redirectToPage("garage");}}>
                            <LinkCard title="Garage" button="Control Garage" icon={faGarage} className="bg-gradient-primary" />
                        </Col>
                        {0 == this.context.getUserId() ? (
                            <Col key="0" md="6" xl="3" onClick={() => {this.redirectToPage("bedroom1");}}>
                                <LinkCard title="Bedroom 1" button="Control Devices" icon={faBedEmpty} className="bg-gradient-info" />
                            </Col>
                        ) : null}
                    </Row>
                    <Row>
                        {0 == this.context.getUserId() ? (
                            <Col key="0" md="6" xl="3" onClick={() => {this.redirectToPage("blinds");}}>
                                <LinkCard title="Blinds" button="Control Blinds" icon={faBlinds} className="bg-gradient-default" />
                            </Col>
                        ) : null}
                        {0 == this.context.getUserId() ? (
                            <Col key="0" md="6" xl="3" onClick={() => {this.redirectToPage("speakers");}}>
                                <LinkCard title="Speakers" button="Control Speakers" icon={faComputerSpeaker} className="bg-gradient-info" />
                            </Col>
                        ) : null}
                    </Row>
                </Container>
            </>
        );
    }
}

HomePage.layout = Admin;

export default HomePage;
