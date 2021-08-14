/*!
Home page / Dashboard
*/
import React, {Component} from "react";

// reactstrap components
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Spinner,
} from "reactstrap";
//classes
import WbSession from "classes/Session.jsx";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faStop } from '@fortawesome/pro-light-svg-icons';

class Blinds extends Component {
    static contextType = WbSession;
    
    debug = false;
    state = {};
    
    //open, close, stop
    buttonPress = async ( action ) => {
        const response = await this.context.blindsAction( action );
        console.log('Blinds action response: ',response);
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( typeof response.error != "undefined" ){
            console.warn('Failed to trigger blinds.', response);
        }
    };
    
    render(){
        return (
            <Card className="border-0">
                <CardHeader>
                    <h1>Blinds</h1>
                </CardHeader>
                <CardBody>
                    <div className="text-align-centre">
                        <Button
                            className={"blindsControl blindsOpen mb-sm-3 mb-md-3 "}
                            color="primary"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                this.buttonPress( 'open' );
                            }}
                        >
                            <FontAwesomeIcon className="cmIcon" icon={faChevronUp} />
                        </Button>
                        <Button
                            className={"blindsControl blindsStop mb-sm-3 mb-md-3 "}
                            color="primary"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                this.buttonPress( 'stop' );
                            }}
                        >
                            <FontAwesomeIcon className="cmIcon" icon={faStop} />
                        </Button>
                        <Button
                            className={"blindsControl blindsClose mb-sm-3 mb-md-3 "}
                            color="primary"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                this.buttonPress( 'close' );
                            }}
                        >
                            <FontAwesomeIcon className="cmIcon" icon={faChevronDown} />
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }
}

export default Blinds;
