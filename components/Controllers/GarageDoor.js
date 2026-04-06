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
    /**
     * Timeout ID for trigger reset.
     * Cleared when door movement completes or resets back to standard polling.
     * @type {ReturnType<typeof setTimeout>|null}
     */
    triggerTimeout = null;
    /**
     * Interval ID for polling garage door state.
     * Cleared/restarted when polling schedule changes (trigger, reset, etc).
     * @type {ReturnType<typeof setInterval>|null}
     */
    intervalTimer = null;
    /**
     * Default interval for polling the door state, in milliseconds.
     * Normal polling cadence.
     * @type {number}
     */
    defaultInterval = 15000; // every 15 seconds
    /**
     * Interval for accelerated polling after a trigger, in milliseconds.
     * Used while the door is actively moving.
     * @type {number}
     */
    triggerInterval = 1000; // every 1 second
    /**
     * After a successful trigger, fast polling stops when this terminal state is reached.
     * `'open'` / `'closed'` when toggling from the opposite; `'any'` when starting from middle/unknown (first stable open or closed).
     * @type {'open' | 'closed' | 'any' | undefined}
     */
    expectedEndStateAfterTrigger = undefined;
    /**
     * Synchronous guard: true while {@link fetchDoorState}'s request is awaiting completion or until its timeout fires.
     * Avoids overlapping polls when `setInterval` fires before React state flushes `loading`.
     * @type {boolean}
     */
    doorStateRequestInFlight = false;
    /**
     * Max wait for `getGarageDoorState` before treating the attempt as finished (next tick may try again).
     * @type {number}
     */
    doorStateFetchTimeoutMs = 5000;

    /**
     * Interval callback: only starts a poll when the previous request has finished or timed out.
     */
    tick() {
        if (this.doorStateRequestInFlight) {
            return;
        }
        this.fetchDoorState();
    }

    /**
     * Restores the default polling interval and clears trigger-timeout bookkeeping.
     */
    resetPollingAfterDoorMotionComplete() {
        clearTimeout(this.triggerTimeout);
        this.triggerTimeout = null;
        clearInterval(this.intervalTimer);
        this.intervalTimer = setInterval(() => this.tick(), this.defaultInterval);
        this.expectedEndStateAfterTrigger = undefined;
    }

    /**
     * @param {string} doorState Response state from the API.
     * @returns {boolean} Whether the door has reached the expected post-trigger terminal state (never true for `middle` unless expecting `'any'` and value is open/closed).
     */
    hasReachedExpectedStateAfterTrigger(doorState) {
        const expected = this.expectedEndStateAfterTrigger;
        if (expected === undefined) {
            return false;
        }
        if (expected === "any") {
            return doorState === "open" || doorState === "closed";
        }
        return doorState === expected;
    }
    
    componentDidMount() {
        this.fetchDoorState();
        
        this.intervalTimer = setInterval(() => this.tick(), this.defaultInterval);
    }

    componentWillUnmount() {
        clearTimeout(this.triggerTimeout);
        clearInterval(this.intervalTimer);
    }
    
    fetchDoorState = async () => {
        const { loading } = this.state;
        if( loading ){
            return;
        }
        if (this.doorStateRequestInFlight) {
            return;
        }

        this.doorStateRequestInFlight = true;
        this.setState({ loading: true, error: false });

        /** @type {ReturnType<typeof setTimeout> | undefined} */
        let fetchTimeoutId;

        try {
            const response = await Promise.race([
                this.context.getGarageDoorState(),
                new Promise((_, reject) => {
                    fetchTimeoutId = setTimeout(() => {
                        reject(new Error("Door state request timed out."));
                    }, this.doorStateFetchTimeoutMs);
                }),
            ]);

            if (fetchTimeoutId !== undefined) {
                clearTimeout(fetchTimeoutId);
            }

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

            if (
                this.state.triggered &&
                !newState.error &&
                this.hasReachedExpectedStateAfterTrigger(newState.doorState)
            ) {
                this.resetPollingAfterDoorMotionComplete();
                newState.triggered = false;
            }

            this.setState(newState);
        } catch (err) {
            if (fetchTimeoutId !== undefined) {
                clearTimeout(fetchTimeoutId);
            }
            const message =
                err instanceof Error ? err.message : "Failed to fetch status. Please try again later.";
            console.warn("Failed to fetch door state.", err);
            this.setState({
                loading: false,
                error: true,
                errorMsg: message,
                doorState: "error",
            });
        } finally {
            this.doorStateRequestInFlight = false;
        }
    };
    
    triggerDoor = async () => {
        const { triggered, doorState } = this.state;
        if( triggered ){
            console.warn('Door already opening - aborted.');
            return;
        }

        /** @type {string} */
        const doorStateAtTrigger = doorState;

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

            if (doorStateAtTrigger === "closed") {
                this.expectedEndStateAfterTrigger = "open";
            } else if (doorStateAtTrigger === "open") {
                this.expectedEndStateAfterTrigger = "closed";
            } else {
                this.expectedEndStateAfterTrigger = "any";
            }

            // Setup quicker interval for checking door state
            clearInterval(this.intervalTimer);
            this.intervalTimer = setInterval(() => this.tick(), this.triggerInterval);

            this.triggerTimeout = setTimeout(() => {
                this.resetPollingAfterDoorMotionComplete();
                this.setState({ triggered: false });
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
                            disabled={triggered}
                            onClick={(e) => {
                                e.preventDefault();
                                if( triggered ){
                                    return;
                                }
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
