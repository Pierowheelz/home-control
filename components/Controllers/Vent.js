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
import Slider from 'react-rangeslider'
//classes
import WbSession from "classes/Session.jsx";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulbOn, faLightbulbSlash, faLightbulbExclamation, faWifiSlash } from '@fortawesome/pro-solid-svg-icons';

class Vent extends Component {
    static contextType = WbSession;
    
    debug = false;
    state = {
        // Data from server
        tmpPosition: 0, // Slider position: 0 -> 100
        position: 0, // Actual vent position: 0 -> 100
        ventName: '',
        loading: false, //loading screen
        error: false,
        errorMsg: "",
    };
    // Timer to trigger each fetch of power state
    intervalTimer = null;
    defaultInterval = 30000; //every 30 seconds
    
    // Timer to update vent position after manual change
    updateTimer = null;
    
    tick() {
        this.fetchVentState();
    }
    
    componentDidMount() {
        const { deviceId } = this.props;
        this.fetchVentState();
        this.intervalTimer = setInterval(() => this.tick(), this.defaultInterval);
        
        if( typeof window !== "undefined" ){
            document.addEventListener( 'ventsupdate', this.onVentUpdate );
        }
    }

    componentWillUnmount() {
        clearInterval(this.intervalTimer);
        
        if( typeof window !== "undefined" ){
            document.removeEventListener( 'ventsupdate', this.onVentUpdate );
        }
    }
    
    fetchVentState = async () => {
        const { loading } = this.state;
        if( loading ){
            return;
        }
        
        this.setState({ loading: true, error: false });
        
        
        const response = await this.context.getVentsState();
        console.log('Vents state response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? false;
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( !success || error ){
            console.warn('Failed to fetch vent state.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
        }
        
        this.setState(newState);
    };
    
    onVentUpdate = (e) => {
        const { deviceId } = this.props;
        console.log(e);
        const state = e.detail ?? {};
        console.log('Got vent update: ', state);
        
        if( typeof state[deviceId] != "undefined" ){
            const deviceName = state[deviceId].name ?? '';
            const devicePosition = state[deviceId].pos ?? 0;
        
            this.setState({position: devicePosition, tmpPosition: devicePosition, ventName: deviceName});
        }
    };
    
    moveVent = async () => {
        const { tmpPosition } = this.state;
        const { deviceId } = this.props;
        
        this.setState({ loading: true });
        
        console.log("Moving vent: ",deviceId, " to ", tmpPosition);
        console.log(this.props);
        const response = await this.context.moveVent( deviceId, tmpPosition );
        console.log('Move Vent response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? false;
        
        let newState = {loading: false, error: false, errorMsg: ''};
        if( !success || error ){
            console.warn('Failed to move vent.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.error = true;
            newState.errorMsg = errorMsg;
        }
        
        this.setState(newState);
    };
    
    render(){
        const {
            tmpPosition, // 0 -> 100
            position, // 0 -> 100
            ventName,
            loading, //loading screen
            error,
            errorMsg,
        } = this.state;
        
        const { deviceId, title } = this.props;
        
        return (
            <Card className="border-0">
                <CardHeader>
                    <h1>{title}</h1>
                </CardHeader>
                <CardBody>
                    <div className="ventState">
                    <div className=" progress-wrapper">
                        <div className=" progress-info">
                            <div className=" progress-label">
                                <span>{ventName}</span>
                            </div>
                            <div className=" progress-percentage">
                                <span><input
                                    type="number"
                                    className="ventInput"
                                    value={tmpPosition}
                                    onChange={(event)=>{
                                        console.log('newval: ',event.target.value);
                                        let value = event.target.value;
                                        value = Math.min( value, 175 );
                                        value = Math.max( value, 0 );
                                        
                                        this.setState({tmpPosition:value});
                                        
                                        // Update real vent position after 0.5s with no input
                                        clearInterval(this.updateTimer);
                                        this.updateTimer = setTimeout(() => {
                                            const { tmpPosition, position } = this.state;
                                            
                                            if( tmpPosition > 100 && confirm('Warning, moving vent beyond 100% may cause damage. Continue to '+tmpPosition+'% ?') ){
                                                this.moveVent();
                                            } else if ( tmpPosition > 100 ){
                                                // User clicked 'no'. Reset tmp pos.
                                                this.setState({tmpPosition:position});
                                            }
                                        },1000);
                                    }}
                                />%</span>
                            </div>
                        </div>
                        <Progress max="100" value={position} color="default"></Progress>
                    </div>
                        {loading ? (
                            <div className="ventStateLoader text-center">
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
                        <p className="text-align-centre">{position}%</p>
                    </div>
                    <Slider
                        value={tmpPosition}
                        min={0}
                        max={100}
                        step={5}
                        onChange={( newPos ) => {
                            console.log('Slider move: ',newPos);
                            this.setState({tmpPosition:newPos});
                        }}
                        onChangeComplete={() => {
                            console.log('Position slider moved to: ', tmpPosition);
                            this.moveVent();
                        }}
                    />
                </CardBody>
            </Card>
        );
    }
}

Vent.propTypes = {
    title: PropTypes.string,
    deviceId: PropTypes.string
};

Vent.defaultProps = {
    title: 'Vent',
    deviceId: "0"
}

export default Vent;
