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
import { faVolume, faVolumeSlash, faQuestionSquare, faWifiSlash } from '@fortawesome/pro-solid-svg-icons';

class Speakers extends Component {
    static contextType = WbSession;
    
    debug = false;
    state = {
        // Data from server
        powerState: 'unknown', // 'on', 'off' (or 'unknown')
        loading: false, //loading screen
        error: false,
        errorMsg: "",
        // Door triggered
        triggered: false,
    };
    triggerTimeout = null;
    // Timer to trigger each fetch of power state
    intervalTimer = null;
    defaultInterval = 30000; //every 30 seconds
    triggerInterval = 2000; //every 2 seconds
    
    tick() {
        this.fetchPowerState();
    }
    
    componentDidMount() {
        this.fetchPowerState();
        this.intervalTimer = setInterval(() => this.tick(), this.defaultInterval);
    }

    componentWillUnmount() {
        clearInterval(this.intervalTimer);
    }
    
    fetchPowerState = async () => {
        const { loading } = this.state;
        if( loading ){
            return;
        }
        
        this.setState({ loading: true, error: false });
        
        const response = await this.context.getSpeakersState();
        console.log('Speakers state response: ',response);
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( typeof response.error !== "undefined" || typeof response.state == "undefined" ){
            console.warn('Failed to fetch speaker state.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
            newState.powerState = 'unknown';
        } else {
            newState.powerState = response.state;
        }
        
        this.setState(newState);
    };
    
    togglePower = async () => {
        const { triggered, powerState } = this.state;
        if( triggered ){
            console.warn('Speakers already triggered - aborted.');
            return;
        }
        
        this.setState({ loading: true, triggered: false });
        clearTimeout( this.triggerTimeout );
        
        let newPowerState = 'on';
        if( 'on' == powerState ){
            newPowerState = 'off';
        }
        
        const response = await this.context.speakersToggle( newPowerState );
        console.log('Speaker toggle response: ',response);
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( typeof response.error != "undefined" ){
            console.warn('Failed to trigger speaker.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
        } else {
            newState.triggered = true;
            
            // Setup quicker interval for checking speaker state
            clearInterval(this.intervalTimer);
            this.intervalTimer = setInterval(() => this.tick(), this.triggerInterval);
            
            this.triggerTimeout = setTimeout(() => {
                this.setState({ triggered: false });
                // Return to default interval
                clearInterval(this.intervalTimer);
                this.intervalTimer = setInterval(() => this.tick(), this.defaultInterval);
            }, 5000);
        }
        
        this.setState(newState);
    };
    
    render(){
        const {
            powerState, // 'on', 'off' (or 'unknown')
            loading, //loading screen
            error,
            errorMsg,
            // Switch triggered
            triggered,
        } = this.state;
        
        return (
            <Card className="border-0">
                <CardHeader>
                    <h1>Speakers</h1>
                </CardHeader>
                <CardBody>
                    <div className="powerState">
                        <div className="text-align-centre">
                            {('on'==powerState) ? (
                                <FontAwesomeIcon className="cmIcon" icon={faVolume} />
                            ) : (
                                <>
                                {('off'==powerState) ? (
                                    <FontAwesomeIcon className="cmIcon" icon={faVolumeSlash} />
                                ) : (
                                    <>
                                    <FontAwesomeIcon className="cmIcon" icon={faQuestionSquare} />
                                    </>
                                )}
                                </>
                            )}
                        </div>
                        {loading ? (
                            <div className="powerStateLoader text-center">
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
                        <p className="text-align-centre">Speakers are: {powerState}</p>
                    </div>
                    <div className="text-align-centre">
                        <br />
                        <Button
                            className={"mb-sm-3 mb-md-3 "}
                            color="primary"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                this.togglePower();
                            }}
                        >
                            Toggle Power
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }
}

export default Speakers;
