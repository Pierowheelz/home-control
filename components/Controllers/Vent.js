/*!
Home page / Dashboard
*/
import React, {Component} from "react";
import PropTypes from "prop-types";

// reactstrap components
import {
    Card,
    CardHeader,
    CardBody,
    Progress,
    Spinner,
} from "reactstrap";
import Slider from 'react-rangeslider'
//classes
import WbSession from "classes/Session.jsx";

import { VentStateContext } from "components/Controllers/middleware/VentStateContext.js";

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifiSlash, faTimes } from '@fortawesome/pro-solid-svg-icons';

import { formatRelativeTimeAgo } from "components/Controllers/middleware/ventRelativeTime.js";

/**
 * @param {{ wantOpen?: boolean|null, manualOverrideActive?: boolean }|null|undefined} row
 * @returns {{ label: string, showOverrideX: boolean }}
 */
function wantOpenDisplay(row) {
    if (!row) {
        return { label: "—", showOverrideX: false };
    }
    const wo = row.wantOpen;
    const label =
        wo === true ? "Open" : wo === false ? "Closed" : "—";
    const showOverrideX = row.manualOverrideActive === true;
    return { label, showOverrideX };
}

class Vent extends Component {
    static contextType = WbSession;
    
    debug = false;
    state = {
        // Data from server
        tmpPosition: 0, // Slider position: 0 -> 100
        position: 0, // Actual vent position: 0 -> 100
        ventName: '',
        /** True while moveVent() is awaiting a response. */
        moveLoading: false,
        moveError: false,
        moveErrorMsg: "",
    };
    
    // Timer to update vent position after manual change
    updateTimer = null;

    /** @type {ReturnType<typeof setInterval> | null} */
    relativeTimeTimer = null;
    
    componentDidMount() {
        if( typeof window !== "undefined" ){
            document.addEventListener( 'ventsupdate', this.onVentUpdate );
            this.relativeTimeTimer = setInterval( () => this.forceUpdate(), 10000 );
        }
    }

    componentWillUnmount() {
        if( typeof window !== "undefined" ){
            document.removeEventListener( 'ventsupdate', this.onVentUpdate );
            if( this.relativeTimeTimer !== null ){
                clearInterval( this.relativeTimeTimer );
                this.relativeTimeTimer = null;
            }
        }
    }
    
    onVentUpdate = (e) => {
        const { deviceId } = this.props;
        console.log(e);
        const state = e.detail ?? {};
        console.log('Got vent update: ', state);
        
        if( typeof state[deviceId] != "undefined" ){
            const deviceName = state[deviceId].name ?? '';
            const devicePosition = state[deviceId].pos ?? 0;
        
            this.setState({position: devicePosition, tmpPosition: devicePosition, ventName: deviceName});
        } else {
            console.log('No vent update for device: ', deviceId);
        }
    };
    
    moveVent = async () => {
        const { tmpPosition } = this.state;
        const { deviceId } = this.props;
        
        this.setState({ moveLoading: true });
        
        console.log("Moving vent: ",deviceId, " to ", tmpPosition);
        console.log(this.props);
        const response = await this.context.moveVent( deviceId, tmpPosition );
        console.log('Move Vent response: ',response);
        
        const success = response.success ?? false;
        const error = response.error ?? false;
        
        let newState = {moveLoading: false, moveError: false, moveErrorMsg: ''};
        if( !success || error ){
            console.warn('Failed to move vent.', response);
            let errorMsg = (response.error || "Failed to fetch status. Please try again later.");
            newState.moveError = true;
            newState.moveErrorMsg = errorMsg;
        }
        
        this.setState(newState);
    };

    /**
     * @param {boolean} pollLoading
     * @param {boolean} pollError
     * @param {string} pollErrorMsg
     * @param {{ loading?: boolean, error?: boolean, errorMsg?: string, roomsByMotorId?: Record<string, object> }|null} ventFetch
     * @returns {import("react").ReactNode}
     */
    renderCard(pollLoading, pollError, pollErrorMsg, ventFetch) {
        const {
            tmpPosition, // 0 -> 100
            position, // 0 -> 100
            ventName,
            moveLoading,
            moveError,
            moveErrorMsg,
        } = this.state;
        
        const { deviceId, title } = this.props;

        const loading = pollLoading || moveLoading;
        const error = pollError || moveError;
        const errorMsg = (pollError && pollErrorMsg) || (moveError && moveErrorMsg) || "";

        const roomRow = ventFetch?.roomsByMotorId?.[String(deviceId)] ?? null;
        const hasTemp =
            roomRow != null &&
            typeof roomRow.temperatureC === "number" &&
            Number.isFinite(roomRow.temperatureC);
        const tempMain = hasTemp ? roomRow.temperatureC.toFixed(1) : null;
        const hasHum =
            roomRow != null &&
            typeof roomRow.humidity === "number" &&
            Number.isFinite(roomRow.humidity);
        const humMain = hasHum ? `${Math.round(roomRow.humidity)}` : null;
        const lastUpStr = formatRelativeTimeAgo(roomRow?.lastUpdateMs);
        const { label: targetLabel, showOverrideX } = wantOpenDisplay(roomRow);

        return (
            <Card className="border-0 vent-room-card h-100 d-flex flex-column">
                <CardHeader>
                    <h1>{title}</h1>
                </CardHeader>
                <CardBody className="d-flex flex-column flex-grow-1 pt-3">
                    <div className="vent-card-metrics mb-4">
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="vent-card-metrics-left pr-2">
                                <div className="vent-temp-row d-flex align-items-baseline flex-wrap">
                                    {hasTemp ? (
                                        <>
                                            <span className="vent-temp-value">{tempMain}</span>
                                            <span className="vent-temp-unit">°C</span>
                                        </>
                                    ) : (
                                        <span className="vent-temp-value vent-temp-missing">—</span>
                                    )}
                                </div>
                                <div className="vent-target-line mt-2 d-flex align-items-center flex-wrap">
                                    <span className="vent-target-label text-muted text-uppercase font-weight-bold mr-2">
                                        Target
                                    </span>
                                    <span className="vent-target-value d-flex align-items-center">
                                        {targetLabel}
                                        {showOverrideX ? (
                                            <FontAwesomeIcon
                                                className="ml-1 text-warning"
                                                icon={faTimes}
                                                title="Manual override active"
                                                aria-label="Manual override active"
                                            />
                                        ) : null}
                                    </span>
                                </div>
                            </div>
                            <div className="vent-card-metrics-right text-right">
                                {hasHum ? (
                                    <>
                                        <div className="vent-humidity-value">{humMain}</div>
                                        <div className="vent-humidity-unit text-muted">% RH</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="vent-humidity-value vent-humidity-missing">—</div>
                                        <div className="vent-humidity-unit text-muted">% RH</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="ventState d-flex flex-column">
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
                                <div className="doorStateLoader text-center" title={errorMsg || undefined}>
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
                    <div className="vent-card-stamp text-muted small text-right">
                        {lastUpStr}
                    </div>
                </CardBody>
            </Card>
        );
    }
    
    render(){
        return (
            <VentStateContext.Consumer>
                {(ventFetch) => {
                    const pollLoading = ventFetch?.loading ?? false;
                    const pollError = ventFetch?.error ?? false;
                    const pollErrorMsg = ventFetch?.errorMsg ?? "";
                    return this.renderCard(pollLoading, pollError, pollErrorMsg, ventFetch);
                }}
            </VentStateContext.Consumer>
        );
    }
}

Vent.propTypes = {
    title: PropTypes.string,
    deviceId: PropTypes.string,
};

Vent.defaultProps = {
    title: 'Vent',
    deviceId: "0",
}

export default Vent;
