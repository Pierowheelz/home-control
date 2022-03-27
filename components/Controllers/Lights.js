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
} from "reactstrap";
//classes
import WbSession from "classes/Session.jsx";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulbOn, faLightbulbSlash, faLightbulbExclamation } from '@fortawesome/pro-solid-svg-icons';

class Light extends Component {
    static contextType = WbSession;
    
    debug = false;
    state = {
        // Data from server
        powerState: 'off', // 'on', 'off' (or 'unknown')
        loading: false, //loading screen
        error: false,
        errorMsg: "",
    };
    // Timer to trigger each fetch of power state
    intervalTimer = null;
    defaultInterval = 30000; //every 30 seconds
    
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
        
        const { deviceId } = this.props;
        
        const response = await this.context.getLightsState( deviceId );
        console.log('Lights state response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? '';
        const reqStatus = response.status ?? 'error';
        const newStatus = response.state ?? 'unknown';
        
        let newState = {loading: false, error: false, errorMsg: ''};
        newState.powerState = newStatus;
        if( !success || error || 'ok' != reqStatus ){
            console.warn('Failed to fetch speaker state.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
            newState.powerState = 'unknown';
        }
        
        this.setState(newState);
    };
    
    togglePower = async () => {
        const { loading, powerState } = this.state;
        // if( loading ){
        //     console.warn('Lights already loading - aborted.');
        //     return;
        // }
        
        this.setState({ loading: true });
        
        let newPowerState = 'on';
        if( 'on' == powerState ){
            newPowerState = 'off';
        }
        const { deviceId } = this.props;
        
        const response = await this.context.lightsToggle( deviceId, newPowerState );
        console.log('Lights toggle response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? '';
        const reqStatus = response.status ?? 'error';
        const newStatus = response.state ?? 'unknown';
        
        let newState = {loading: false, error: false, errorMsg: ''};
        newState.powerState = newStatus;
        if( !success || error || 'ok' != reqStatus ){
            console.warn('Failed to trigger speaker.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
        }
        
        this.setState(newState);
    };
    
    render(){
        const {
            powerState, // 'on', 'off' (or 'unknown')
            loading, //loading screen
            error,
            errorMsg,
        } = this.state;
        
        const { title } = this.props;
        
        return (
            <Card className="border-0">
                <CardHeader>
                    <h1>{title}</h1>
                </CardHeader>
                <CardBody>
                    <div className="powerState">
                        <div className="text-align-centre">
                            {('on'==powerState) ? (
                                <FontAwesomeIcon className="cmIcon" icon={faLightbulbOn} />
                            ) : (
                                <>
                                {('off'==powerState) ? (
                                    <FontAwesomeIcon className="cmIcon" icon={faLightbulbSlash} />
                                ) : (
                                    <>
                                    <FontAwesomeIcon className="cmIcon" icon={faLightbulbExclamation} />
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
                        ) : (<></>)}
                        <p className="text-align-centre">Lights are: {powerState}</p>
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
                            Toggle Light
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }
}

Light.propTypes = {
    title: PropTypes.string,
    deviceId: PropTypes.string
};

Light.defaultProps = {
    title: 'Lights'
}

export default Light;
