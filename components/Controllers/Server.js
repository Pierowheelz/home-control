/*!
Home page / Dashboard
*/
import React, {Component} from "react";
import PropTypes from "prop-types";

// reactstrap components
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Progress,
    Spinner,
    FormGroup,
    CustomInput,
} from "reactstrap";
import Slider from 'react-rangeslider'
//classes
import WbSession from "classes/Session.jsx";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlugCircleCheck, faPlugCircleExclamation, faPlugCircleXmark, faWifiSlash } from '@fortawesome/pro-solid-svg-icons';

class Server extends Component {
    static contextType = WbSession;
    
    debug = false;
    state = {
        // Data from server
        switchStatus: 'unknown', // 'on' / 'off' / 'unknown'
        controllerStatus: 'online',
        consumption: {}, // consumption data (eg. power usage)
        prevent: 0, // Prevent Shutdown toggle status
        immediate: 0, // Immediate Shutdown toggle status
        loading: false, //loading screen
        error: false,
        errorMsg: "",
    };
    // Timer to trigger each fetch of power state
    intervalTimer = null;
    defaultInterval = 30000; //every 30 seconds
    
    tick() {
        this.fetchServerState();
    }
    
    componentDidMount() {
        this.fetchServerState();
        this.intervalTimer = setInterval(() => this.tick(), this.defaultInterval);
    }

    componentWillUnmount() {
        clearInterval(this.intervalTimer);
    }
    
    fetchServerState = async () => {
        const { loading } = this.state;
        if( loading ){
            return;
        }
        
        this.setState({ loading: true, error: false });
        
        
        const response = await this.context.getServerState();
        console.log('Server Controller state response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? false;
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( !success || error ){
            console.warn('Failed to fetch ServerControl state.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
        } else {
            newState.error = false;
        }
        newState = this.updateServerState( newState, response );
        
        this.setState(newState);
    };
    
    bootServer = async () => {
        this.setState({ loading: true });
        
        console.log("Booting server... ");
        const response = await this.context.bootServer();
        console.log('Boot Server response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? false;
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( !success || error ){
            console.warn('Failed to boot server.', response);
            let errorMsg = (response.error || "Failed to boot server. Please try again later.");
            if( 'already_on' == errorMsg ){
                errorMsg = "Server is already on!";
            }
            newState.error = true;
            newState.errorMsg = errorMsg;
        } else {
            newState.error = false;
        }
        newState = this.updateServerState( newState, response );
        
        this.setState(newState);
    };
    
    shutdownServer = async () => {
        this.setState({ loading: true });
        
        console.log("Shutting Down server... ");
        const response = await this.context.shutdownServer();
        console.log('Shut Down Server response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? false;
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( !success || error ){
            console.warn('Failed to shutdown server.', response);
            let errorMsg = (response.error || "Failed to shutdown server. Please try again later.");
            if( 'already_off' == errorMsg ){
                errorMsg = "Server is already off!";
            } else if( "offline" == errorMsg ){
                errorMsg = "Failed to update - control service is offline. Please try again later.";
            }
            newState.error = true;
            newState.errorMsg = errorMsg;
        } else {
            newState.error = false;
        }
        newState = this.updateServerState( newState, response );
        
        this.setState(newState);
    };
    
    togglePreventShutdown = async ( targetState ) => {
        this.setState({ loading: true });
        
        const targetStageString = targetState ? '1' : '0';
        
        console.log("Toggling PreventShutdown to: ", targetState);
        const response = await this.context.serverTogglePreventShutdown( targetStageString );
        console.log('Toggle PreventShutdown response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? false;
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( !success || error ){
            console.warn('Failed to toggle PreventShutdown.', response);
            let errorMsg = (response.error || "Failed to toggle Prevent-Shutdown status. Please try again later.");
            if( "offline" == errorMsg ){
                errorMsg = "Failed to update - control service is offline. Please try again later.";
            }
            newState.error = true;
            newState.errorMsg = errorMsg;
        } else {
            newState.error = false;
        }
        newState = this.updateServerState( newState, response );
        
        this.setState(newState);
    };
    
    updateServerState = ( newState, message ) => {
        const { switchStatus, controllerStatus, consumption, prevent, immediate } = this.state;
        
        newState.switchStatus = message.state ?? switchStatus;
        newState.controllerStatus = message.controller ?? controllerStatus;
        newState.consumption = message.consumption ?? consumption;
        newState.prevent = message.prevent ?? prevent;
        newState.immediate = message.immediate ?? immediate;
        
        return newState;
    };
    
    render(){
        const {
            switchStatus,
            controllerStatus,
            consumption,
            prevent,
            immediate,
            
            loading, //loading screen
            error,
            errorMsg,
        } = this.state;
        
        const consumptionWatts = consumption.Power ?? 0;
        let usagePercent = 0;
        if( 0 !== consumptionWatts ){
            usagePercent = (consumptionWatts / 400) * 100; // Assuming a max consumption of 400 watts
        }
        
        let consumptionStats = "";
        if( typeof consumption.Today != "undefined" ){
            consumptionStats = "Today: "+consumption.Today+"kW⋅h | Yesterday: "+consumption.Yesterday+"kW⋅h";
        }
        
        return (
            <Card className="border-0">
                <CardHeader>
                    <h1>UNRAID Server Controller</h1>
                </CardHeader>
                <CardBody>
                    <div className="serverState">
                        <div className="text-align-centre">
                            {('on'==switchStatus) ? (
                                <FontAwesomeIcon className="cmIcon" icon={faPlugCircleCheck} />
                            ) : (
                                <>
                                {('off'==switchStatus) ? (
                                    <FontAwesomeIcon className="cmIcon" icon={faPlugCircleExclamation} />
                                ) : (
                                    <>
                                    <FontAwesomeIcon className="cmIcon" icon={faPlugCircleXmark} />
                                    </>
                                )}
                                </>
                            )}
                        </div>
                        <div className=" progress-wrapper">
                            <div className=" progress-info">
                                <div className=" progress-label">
                                    <span>Power Usage</span>
                                </div>
                                <div className=" progress-percentage">
                                    <span>{consumptionWatts} Watts</span>
                                </div>
                            </div>
                            <Progress max="100" value={usagePercent} color="default"></Progress>
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
                        <p className="text-align-centre">
                            Server is: {switchStatus} {('offline'==controllerStatus)?(<>(Controller Offline)</>):(null)}
                        </p>
                        <p className="text-align-centre">{consumptionStats}</p>
                        <div className="text-align-centre">
                            <br />
                            {('on'==switchStatus) ? (
                                <>
                                {(!immediate) ? (
                                    <>
                                    <Button
                                        className={"mb-sm-3 mb-md-3 "}
                                        color="primary"
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            this.shutdownServer();
                                        }}
                                    >
                                        Shutdown Now
                                    </Button>
                                    <br />
                                    <FormGroup>
                                        <CustomInput
                                            type="switch"
                                            id="prevent_shutdown"
                                            label="Prevent Shutdown"
                                            checked={prevent}
                                            onChange={() => {
                                                this.togglePreventShutdown( !prevent );
                                            }}
                                        />
                                    </FormGroup>
                                    </>
                                ) : (
                                    <Button
                                        className={"mb-sm-3 mb-md-3 "}
                                        color="primary"
                                        type="button"
                                        disabled
                                    >
                                        Shutting Down
                                    </Button>
                                )}
                                </>
                            ) : (
                                <Button
                                    className={"mb-sm-3 mb-md-3 "}
                                    color="primary"
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        this.bootServer();
                                    }}
                                >
                                    Boot Server
                                </Button>
                            )}
                        </div>
                    </div>
                    
                </CardBody>
            </Card>
        );
    }
}

export default Server;
