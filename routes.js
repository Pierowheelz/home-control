/*!

* This file outlines routes (used to generate Sidebar links).
*     NOTE: actual URLs are generated by NextJS using files in pages/ folder.

*/
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTachometer,
} from '@fortawesome/pro-light-svg-icons';

const getAppRoutes = ( userId ) => {
    let dashboardViews = [
        {
            path: "/",
            name: "Dashboard",
            miniName: "D",
            layout: "",
        },
        {
            path: "/garage",
            name: "Garage",
            miniName: "G",
            layout: "",
        },
    ];
    
    if( 0 == userId ){
        dashboardViews.push(
            {
                path: "/seakers",
                name: "Speakers",
                miniName: "S",
                layout: "",
            }
        );
        dashboardViews.push(
            {
                path: "/blinds",
                name: "Blinds",
                miniName: "B",
                layout: "",
            }
        );
    }
    
    return [
        {
            collapse: true,
            name: "Dashboards",
            icon: faTachometer,
            state: "dashboardsCollapse",
            noUser: true, //allow when not logged in?
            views: dashboardViews,
        }
    ];
};

export default getAppRoutes;
