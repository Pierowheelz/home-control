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

import { faBedEmpty, faGarage, faBlinds, faComputerSpeaker, faServer, faWind } from '@fortawesome/pro-light-svg-icons';

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
        if( typeof window == "undefined" ){
            return (
                <>
                    <SimpleHeader />
                    <Container className="mt--6" fluid>
                        <Row>
                        ...loading
                        </Row>
                    </Container>
                </>
            );
        }
        
        console.log( "User ID: ", this.context.getUserId() );
        
        return (
            <>
                <SimpleHeader />
                <Container className="mt--6" fluid>
                    <Row>
                        {0 == this.context.getUserId() ? (
                            <Col id="col_bedroom1" key="0" md="6" xl="3" onClick={() => {this.redirectToPage("bedroom1");}}>
                                <LinkCard key="bedroom1" id="card_bedroom1" title="Bedroom 1" button="Control Devices" icon={faBedEmpty} className="bg-gradient-info" />
                            </Col>
                        ) : null}
                        {1 == this.context.getUserId() ? (
                            <Col id="col_bedroom0" key="1" md="6" xl="3" onClick={() => {this.redirectToPage("bedroom0");}}>
                                <LinkCard key="bedroom0" id="card_bedroom0" title="Master Bedroom" button="Control Devices" icon={faBedEmpty} className="bg-gradient-info" />
                            </Col>
                        ) : null}
                        {0 == this.context.getUserId() ? (
                            <Col id="col_server" key="2" md="6" xl="3" onClick={() => {this.redirectToPage("server");}}>
                                <LinkCard key="server" id="card_server" title="Server" button="Control Server" icon={faServer} className="bg-gradient-dark" />
                            </Col>
                        ) : null}
                        <Col id="col_vents" key="3" md="6" xl="3" onClick={() => {this.redirectToPage("vents");}}>
                            <LinkCard key="vents" id="card_vents" title="AC Vents" button="Control Vents" icon={faWind} className="bg-gradient-primary" />
                        </Col>
                        <Col id="col_garage" key="4" md="6" xl="3" onClick={() => {this.redirectToPage("garage");}}>
                            <LinkCard key="garage" id="card_garage" title="Garage" button="Control Garage" icon={faGarage} className="bg-gradient-default" />
                        </Col>
                        {/*0 == this.context.getUserId() ? (
                            <Col key="5" md="6" xl="3" onClick={() => {this.redirectToPage("blinds");}}>
                                <LinkCard title="Blinds" button="Control Blinds" icon={faBlinds} className="bg-gradient-default" />
                            </Col>
                        ) : null*/}
                    </Row>
                </Container>
            </>
        );
    }
}

HomePage.layout = Admin;

export default HomePage;
