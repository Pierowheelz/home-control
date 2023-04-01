// ##############################
// // // Login state and API connection
// #############################
import React, { createContext } from "react";
import Storage from "classes/Storage.jsx";
//import Push from "classes/Push.jsx";

let wbStorage = new Storage();
//let wbPush = new Push();

class Session {
    constructor() {
        this.logging = true;
        
        //this.primary_url = process.env.api_url + "";
        //this.backup_url = process.env.api_bak_url + "";
        
        this.url = "https://pwproxy.webbird.info/index.php";//this.primary_url; //process.env.api_url +
        
        this.session_id = null;
        this.refreshToken = null;
        this.user_id = null;
        this.push_key = null;
        this.sessionError = function(e){};
        this.is_logging_in = false;
        
        this.restoreSession();
    }
    
    /**
     * Perform a login with username/password and set this.session_id and this.user_id
     */
    login = async ( user, pass ) => {
        if( typeof window == "undefined" ){
            return false;
        }
        if( this.logging ) console.log('Attempting login');
        this.is_logging_in = true;
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {'Content-Type': 'application/json'},
                method: 'post',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/auth",
                    body: {
                        email: user,
                        password: pass,
                    },
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        
        if( ret.accessToken ){
            if( this.logging ) console.log('Login success! Saving session.', ret);
            this.session_id = ret.accessToken;
            this.refreshToken = ret.refreshToken;
            this.user_id = ret.userId ?? null;
            this.save_session( this.session_id, this.user_id );
            
            //const key = await this.getPushKey();
            
            //this.subscribeToPush( key );
        }
        this.is_logging_in = false;
        //console.log(ret);
        return ret;
    };
    
    /**
     * Get the current user's profile details
     *
     * NOTE: untested
     */
    getProfile = async () => {
        if( typeof window == "undefined" ){
            return false;
        }
        if( !this.isLoggedIn || null == this.user_id || 'null' === this.user_id ){
            return {success:false,code:'not_logged_in',message:"You are not logged in."};
        }
        
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'default',
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'put',
                body: JSON.stringify({
                    endpoint: "/users/"+this.user_id,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                }),
                redirect: 'follow',
                referrer: 'no-referrer'
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        return ret;
    };
    
    register = async ( fname, lname, email, pass ) => {
        if( typeof window == "undefined" ){
            return false;
        }
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'post',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/users",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                    body: {
                        firstName: fname,
                        lastName: lname,
                        email: email,
                        password: pass,
                        permissionLevel: 1
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        
        return ret;
    };
    
    // getPushKey = async () => {
    //     const response = await this._fetchWithTimeout(
    //         this.url + "/builders-app/v1/pushkey",
    //         {
    //             cache: 'no-store',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             method: 'put',
    //             redirect: 'follow',
    //             referrer: 'no-referrer'
    //         }
    //     );
    //
    //     let ret = await response.json();
    //
    //     if( this.logging ) console.log(ret);
    //
    //     if( ret.key && '' !== ret.key ){
    //         wbStorage.set_item( "pushKey", ret.key );
    //         this.push_key = ret.key;
    //     }
    //     return this.push_key;
    // };
    
    // subscribeToPush = async ( key ) => {
    //     const subscription = await wbPush.subscribeUser( key );
    //
    //     if( this.logging ) console.log('Push handler registered:');
    //     if( this.logging ) console.log( JSON.stringify(subscription) );
    //     //send to our server
    //
    //     const response = await this._fetchWithTimeout(
    //         this.url + "/builders-app/v1/registerpush",
    //         {
    //             cache: 'no-store',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': 'Bearer '+this.session_id,
    //             },
    //             method: 'post',
    //             redirect: 'follow',
    //             referrer: 'no-referrer',
    //             body: JSON.stringify({
    //                 push: subscription
    //             })
    //         }
    //     );
    //
    //     let ret = await response.json();
    //
    //     if( ret.success ){
    //         if( this.logging ) console.log('Successfully registered for push notifications');
    //     } else {
    //         console.log( ret );
    //     }
    // };
    //
    // unSubscribeToPush = async () => {
    //     await wbPush.unSubscribe();
    // };
    
    /**
     * Validate a session to ensure it's not expired
     *
     * NOTE: untested
     */
    validate_session = async () => {
        if( typeof window == "undefined" ){
            return false;
        }
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'post',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/auth/refresh",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                    body: {
                        refresh_token: this.refreshToken
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        
        let valid = false;
        if( ret.accessToken ){
            if( this.logging ) console.log('Login success! Saving session.');
            this.session_id = ret.accessToken;
            this.refreshToken = ret.refreshToken;
            this.user_id = ret.userId ?? null;
            this.save_session( this.session_id, this.user_id );
            
            valid = true;
            //const key = await this.getPushKey();
            
            //this.subscribeToPush( key );
        }
        
        if( !valid ){
            if( this.logging ) console.log('session invalid - removing localstorage');
            this.logout();
        }
        
        return valid;
    };
    
    /**
     * Gets Garage Door state.
     */
    getGarageDoorState = async () => {
        if( typeof window == "undefined" ){
            return false;
        }
        
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'put',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/garage",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        return ret;
    };
    
    /**
     * Triggers the garage door button
     */
    triggerGarageDoor = async () => {
        if( typeof window == "undefined" ){
            return false;
        }
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'post',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/garage",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        return ret;
    };
    
    /**
     * Gets Speakers state.
     */
    getSpeakersState = async () => {
        if( typeof window == "undefined" ){
            return false;
        }
        
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'put',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/speakers",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        return ret;
    };
    
    /**
     * Turn speakers on/off
     */
    speakersToggle = async ( action ) => {
        if( typeof window == "undefined" ){
            return false;
        }
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'post',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/speakers/"+action,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        return ret;
    };
    
    /**
     * Gets Lights state.
     */
    getLightsState = async ( deviceId ) => {
        if( typeof window == "undefined" ){
            return false;
        }
        
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'put',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/estatus/"+deviceId,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        return ret;
    };
    
    /**
     * Turn speakers on/off
     */
    lightsToggle = async ( deviceId, action ) => {
        if( typeof window == "undefined" ){
            return false;
        }
        const endpoint = 'eturn'+action;
        
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'post',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/"+endpoint+"/"+deviceId,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        return ret;
    };
    
    /**
     * Turn speakers on/off
     */
    blindsAction = async ( action ) => {
        if( typeof window == "undefined" ){
            return false;
        }
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'post',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/blinds/"+action,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        return ret;
    };
    
    /**
     * Gets Vents state.
     */
    getVentsState = async () => {
        if( typeof window == "undefined" ){
            return false;
        }
        
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'put',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/vents",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        if( ret.status ){
            const updateEvent = new CustomEvent( 'ventsupdate', {detail:ret.status} );
            document.dispatchEvent(updateEvent);
        }
        
        return ret;
    };
    
    /**
     * Move vent to position
     */
    moveVent = async ( deviceId, position ) => {
        if( typeof window == "undefined" ){
            return false;
        }
        
        const response = await this._fetchWithTimeout(
            this.url,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+this.session_id,
                },
                method: 'post',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: JSON.stringify({
                    endpoint: "/vents/"+deviceId+"/"+position,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer '+this.session_id,
                    },
                })
            }
        );
        
        let ret = response;
        if( typeof ret.json == "function" ){
            ret = await response.json();
        }
        this.check_session(ret);
        
        if( ret.status ){
            const updateEvent = new CustomEvent( 'ventsupdate', {detail:ret.status} );
            document.dispatchEvent(updateEvent);
        }
        
        return ret;
    };
    
    _fetchWithTimeout = (url, options) => {
        console.log('Fetch command issued: ', url);
        
        const controller = new AbortController();
        const signal = controller.signal;
        setTimeout(() => {
            controller.abort()
        }, 16000);
        
        const newOptions = { ...options, signal };
        
        return fetch( url, newOptions ).catch( async (err) => {
            if( typeof window == "undefined" ){
                return false;
            }
            console.log('Fetch failed: ', err);
            const errorOb = {
                code: 'offline',
                success: false,
            };
            
            const noWifi = false;
            if( typeof navigator != "undefined" ){
                if( !navigator.onLine ){
                    errorOb.message = "You are offline, please check your connection and try again.";
                    noWifi = true;
                }
            }
            
            // if( !noWifi ){
            //     // Device has internet, but server is offline
            //
            //     //try backup server
            //     if( url.includes( this.primary_url ) ){
            //         const backupUrl = url.replace( this.primary_url, this.backup_url );
            //         return await this._fetchWithTimeout( backupUrl, options );
            //     }
            // }
            
            return errorOb;
        });
    };
    
    /*
	 * checks localstorage and restores previous session
	 */
	restoreSession(){
        if( typeof window == "undefined" ){
            return false;
        }
		if( this.logging ) console.log('attempting to restore session');
		let session_id = wbStorage.get_item("sessionID");
		if( null != session_id && 'null' !== session_id ){
			if( this.logging ) console.log('session restored: '+session_id);
			this.session_id = session_id;
			
            //TODO: maybe fire an event here or something
		}
		let user_id = wbStorage.get_item("userID");
		if( user_id !== null ){
			if( this.logging ) console.log('user_id restored: '+user_id);
			this.user_id = user_id;
			
            //TODO: maybe fire an event here or something
		}
        
		// let push_key = wbStorage.get_item("pushKey");
		// if( push_key !== null ){
		// 	if( this.logging ) console.log('push_key restored: '+push_key);
		// 	this.push_key = push_key;
        //
        //     //TODO: maybe fire an event here or something
		// } else {
        //     this.getPushKey();
        // }
	}
    
    /*
	 * saves the current session to localstorage
	 */
	save_session( session, user_id ){
        if( typeof window == "undefined" ){
            return false;
        }
		wbStorage.set_item( "sessionID", session );
		wbStorage.set_item( "userID", user_id );
	}
    
    /*
     * To be called with the result of every Ajax request - checks to ensure that we are still logged in
     *  If not, triggers this.logout()
     */
    check_session( data ){
        if( typeof window == "undefined" ){
            return false;
        }
        let result = true;
        let invalidCodes = [
            'jwt_auth_invalid_token',
            'jwt_auth_no_auth_header',
            'jwt_auth_bad_auth_header',
            'jwt_auth_bad_config',
            'jwt_auth_bad_iss',
            'jwt_auth_bad_request',
        ];
        
        if( typeof data.code != "undefined" && invalidCodes.includes(data.code) ){
            //this.logout();
            result = false;
            
            let sessionErrorMsg = (data.message || "Your login session has expired. Please log in again.");
            //this.logout();
            this.sessionError( sessionErrorMsg );
        }
        
        return result;
    }
    
    /*
	 * gets the current user id
	 */
	getUserId(){
        return this.user_id;
	}
    
    /*
	 * removes the current session from localstorage
	 */
	logout(){
        if( typeof window == "undefined" ){
            return false;
        }
        if( this.is_logging_in )
            return;
        if( this.logging ) console.log('Logout triggered');
		wbStorage.set_item( "sessionID", null );
		wbStorage.set_item( "userID", null );
		wbStorage.set_item( "pushKey", null );
        this.user_id = null;
        this.session_id = null;
        this.push_key = null;
        
        //this.unSubscribeToPush();
	}
    
    /*
	 * Checks whether we are currently logged in (but does not validate session)
	 */
    isLoggedIn(){
        //if( this.logging ) console.log('Checking for presence of session token: '+this.session_id);
        return (null != this.session_id && 'null' !== this.session_id);
    }
    
    /*
     * Passes us the setState function of the primary controller class, allowing us to
     * trigger notifications when a user's session expires.
     */
    passControllerErrorFunction( errorFunction ){
        this.sessionError = errorFunction;
    }
}

const WbSession = createContext(new Session());

export default WbSession;
