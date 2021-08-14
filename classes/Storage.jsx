// ##############################
// // // Wrapper for localstorage and cookies
// #############################
class Storage{
    
    /*
	 * called on new Storage();
	 */
    constructor( tempstore ) {
    	if( typeof terminal == 'undefined' ){
    		this.is_temp = false;
    	} else {
    		this.is_temp = tempstore;
    	}
    	this.logging = false;
        
		// if ('serviceWorker' in navigator) {
		// 	navigator.serviceWorker.register('js/serviceworker.js', { scope: '/' }).then(function(reg) {
		// 		if(reg.installing) {
		// 			console.log('Service worker installing');
		// 		} else if(reg.waiting) {
		// 			console.log('Service worker installed');
		// 		} else if(reg.active) {
		// 			console.log('Service worker active');
		// 		}
		// 	}).catch(function(error) {
		// 		// registration failed
		// 		console.log('Registration failed with ' + error);
		// 	});
		// } else {
		// 	console.log('ServiceWorkers not supported by Browser');
		// }
	};
	
	/*
	 * used to fetch an item from the localstore/filestore
	 */
	get_item = ( name, default_value ) => {
		if( typeof default_value == 'undefined' ){
			default_value = null;
		}
		var value = null;
        if (typeof window !== 'undefined') {
    		if( !this.is_temp ){
    			value = localStorage.getItem(name);
    			if( this.logging ) console.log('Variable '+name+' loaded from localstorage');
    		} else {
    			value = sessionStorage.getItem(name);
    			if( this.logging ) console.log('Variable '+name+' loaded from sessionstorage');
    		}
        }
		if( value == null ){
			value = default_value;
		}
		
		return value;
	};
	
	set_item = ( name, value ) => {
		var success = true; //localstorage doesn`t really ever fail
        if (typeof window !== 'undefined') {
    		if( !this.is_temp ){
    			localStorage.setItem( name, value );
    			if( this.logging ) console.log('Variable '+name+' saved to localstorage');
    		} else {
    			sessionStorage.setItem( name, value );
    			if( this.logging ) console.log('Variable '+name+' saved to sessionstorage');
    		}
        }

		return success;
	};
	
	delete_item = ( name ) => {
		var success = true; //localstorage doesn't really ever fail
        if (typeof window !== 'undefined') {
    		if( !this.is_temp ){
    			localStorage.removeItem( name );
    			if( this.logging ) console.log('Variable '+name+' removed from localstorage');
    		} else {
    			localStorage.removeItem( name );
    			if( this.logging ) console.log('Variable '+name+' removed from sessionstorage');
    		}
        }
		
		return success;
	};
};

export default Storage;
