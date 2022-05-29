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
    Progress,
    Spinner,
} from "reactstrap";
//classes
import WbSession from "classes/Session.jsx";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGarage, faGarageOpen, faGarageCar, faQuestionSquare, faWifiSlash } from '@fortawesome/pro-solid-svg-icons';

class GarageDoor extends Component {
    static contextType = WbSession;
    
    debug = false;
    state = {
        // Data from server
        doorState: 'unknown', // 'closed', 'middle', 'open' (or 'error' / 'unknown')
        loading: false, //loading screen
        error: false,
        errorMsg: "",
        // Door triggered
        triggered: false,
    };
    triggerTimeout = null;
    // Timer to trigger each fetch of door state
    intervalTimer = null;
    defaultInterval = 10000; //every 30 seconds
    triggerInterval = 1000; //every 5 seconds
    
    tick() {
        this.fetchDoorState();
    }
    
    componentDidMount() {
        this.fetchDoorState();
        
        this.intervalTimer = setInterval(() => this.tick(), this.defaultInterval);
    }

    componentWillUnmount() {
        clearInterval(this.intervalTimer);
    }
    
    fetchDoorState = async () => {
        const { loading } = this.state;
        if( loading ){
            return;
        }
        
        this.setState({ loading: true, error: false });
        
        const response = await this.context.getGarageDoorState();
        console.log('Garage door state response: ',response);
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( typeof response.error !== "undefined" || typeof response.state == "undefined" ){
            console.warn('Failed to fetch door state.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
            newState.doorState = 'error';
        } else {
            newState.doorState = response.state;
        }
        
        this.setState(newState);
    };
    
    triggerDoor = async () => {
        const { triggered } = this.state;
        if( triggered ){
            console.warn('Door already opening - aborted.');
            return;
        }
        
        this.setState({ loading: true, triggered: false });
        clearTimeout( this.triggerTimeout );
        
        const response = await this.context.triggerGarageDoor();
        console.log('Garage door toggle response: ',response);
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( typeof response.error != "undefined" ){
            console.warn('Failed to trigger door.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
        } else {
            newState.triggered = true;
            
            // Setup quicker interval for checking door state
            clearInterval(this.intervalTimer);
            this.intervalTimer = setInterval(() => this.tick(), this.triggerInterval);
            
            this.triggerTimeout = setTimeout(() => {
                this.setState({ triggered: false });
                // Return to default interval
                clearInterval(this.intervalTimer);
                this.intervalTimer = setInterval(() => this.tick(), this.defaultInterval);
            }, 12000);
        }
        
        this.setState(newState);
    };
    
    render(){
        const {
            doorState, // 'closed', 'middle', 'open' (or 'unknown')
            loading, //loading screen
            error,
            errorMsg,
            // Door triggered
            triggered,
        } = this.state;
        
        return (
            <Card className="border-0">
                <CardHeader>
                    <h1>Garage Door</h1>
                </CardHeader>
                <CardBody>
                    <div className="doorState">
                        <div className="text-align-centre">
                            {('open'==doorState) ? (
                                <FontAwesomeIcon className="cmIcon" icon={faGarageCar} />
                            ) : (
                                <>
                                {('closed'==doorState) ? (
                                    <FontAwesomeIcon className="cmIcon" icon={faGarage} />
                                ) : (
                                    <>
                                    {('middle'==doorState) ? (
                                        <FontAwesomeIcon className="cmIcon" icon={faGarageOpen} />
                                    ) : (
                                        <FontAwesomeIcon className="cmIcon" icon={faQuestionSquare} />
                                    )}
                                    </>
                                )}
                                </>
                            )}
                        </div>
                        {loading ? (
                            <div className="doorStateLoader text-center">
                                <Spinner color="primary" />
                                <p></p>
                            </div>
                        ) : (<>
                            {error ? (
                                <div className="doorStateLoader text-center">
                                    <FontAwesomeIcon className="cmError" icon={faWifiSlash} />
                                    <p></p>
                                </div>
                            ) : null}
                        </>)}
                        <p className="text-align-centre">The door is: {doorState}</p>
                    </div>
                    <div className="text-align-centre">
                        <br />
                        <Button
                            className={"mb-sm-3 mb-md-3 "}
                            color="primary"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                this.triggerDoor();
                            }}
                        >
                            Trigger Door
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }
}

export default GarageDoor;
