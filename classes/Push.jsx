// ##############################
// // // Push notification registration & messaging
// #############################
class Push {
    constructor() {
        this.debug = true;
        this.logging = true;
        
        this.swRegistration = null;
        
        this.getSWRegistration();
        console.log('Push class initialised');
    }
    
    subscribeUser = async ( key ) => {
        
        if( this.logging ) console.log('Attempting SW registration');
        const swRegistration = await this.getSWRegistration();
        if( this.logging ) console.log('Got SW registration');
        
        if( !swRegistration ){
            console.log('Error: Browser does not support serviceWorkers');
            return false;
        }
        
        if( this.debug ){
            const oldSubscription = await swRegistration.pushManager.getSubscription();
            if( oldSubscription )
                oldSubscription.unsubscribe();
        }
        
        const applicationServerKey = this.urlB64ToUint8Array( key );
        
        if( false === applicationServerKey || null === applicationServerKey ){
            console.log('Error: applicationServerKey is null (key not set)');
            return false;
        }
        
        const registration = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });
        if( this.logging ) console.log('Got Push registration');
        
        return registration;
    }
    
    unSubscribe = async () => {
        if( this.logging ) console.log('Attempting SW unSubscription');
        const swRegistration = await this.getSWRegistration();
        if( this.logging ) console.log('Got SW registration - preparing to unsubscribe');
        
        const oldSubscription = await swRegistration.pushManager.getSubscription();
        if( oldSubscription )
            oldSubscription.unsubscribe();
        if( this.logging ) console.log('SW unsubscribed');
    }
    
    getSWRegistration = async () => {
        if ( !('serviceWorker' in navigator) )
            return false;
        
        let sw = null;
        
        if( null == this.swRegistration ){
            let pubUrl = process.env.public_url;
            const swUrl = pubUrl + '/sw-push.js';
            sw = await navigator.serviceWorker.register( swUrl );
            
            if( '' === pubUrl ){
                pubUrl = window.location.protocol + '//' + window.location.hostname;
                if( 443 !== window.location.port ){
                    pubUrl += ':'+window.location.port;
                }
            }
            
            if( null !== sw.active ){
                sw.active.postMessage(JSON.stringify({url: pubUrl}));
            }
            
            if( this.logging ) console.log('ServiceWorker registered');
        } else {
            sw = this.swRegistration;
        }
        
        return sw;
    }
    
    urlB64ToUint8Array = (base64String) => {
        console.log(base64String);
        if( null === base64String )
            return false;
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

export default Push;
