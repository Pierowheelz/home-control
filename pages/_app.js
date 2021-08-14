import React from "react";
import ReactDOM from "react-dom";
import App from "next/app";
import Head from "next/head";
//import Router from "next/router";

// core styles
import "assets/scss/style.scss?v1.1.0";

// Page change animation
//import PageChange from "components/PageChange/PageChange.js";

// Router.events.on("routeChangeStart", (url) => {
//     console.log(`Loading: ${url}`);
//     document.body.classList.add("body-page-transition");
//     ReactDOM.render(
//         <PageChange path={url} />,
//         document.getElementById("page-transition")
//     );
// });
// Router.events.on("routeChangeComplete", () => {
//     ReactDOM.unmountComponentAtNode(document.getElementById("page-transition"));
//     document.body.classList.remove("body-page-transition");
// });
// Router.events.on("routeChangeError", () => {
//     ReactDOM.unmountComponentAtNode(document.getElementById("page-transition"));
//     document.body.classList.remove("body-page-transition");
// });

export default class MyApp extends App {
    
    state = {
        online: true,
    };
    
    componentDidMount() {
        let comment = document.createComment("Home control app - by Peter Wells");
        document.insertBefore(comment, document.documentElement);
        if( typeof window != "undefined" ){
            window.addEventListener('online',  this.updateOnlineStatus);
            window.addEventListener('offline', this.updateOnlineStatus);
        }
    }
    
    static async getInitialProps({ Component, router, ctx }) {
        let pageProps = {};

        if (Component.getInitialProps) {
            pageProps = await Component.getInitialProps(ctx);
        }

        return { pageProps };
    }
    
    updateOnlineStatus = (e) => {
        if( typeof navigator == "undefined" ){
            return;
        }
        this.setState( {online: navigator.onLine} );
    };
    
    render() {
        const { online } = this.state;
        const { Component, pageProps } = this.props;

        const Layout = Component.layout || (({ children }) => <>{children}</>);

        return (
            <React.Fragment>
                <Head>
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1, shrink-to-fit=no"
                    />
                    <title>Home Control</title>
                </Head>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
                {!online ? (<div className="globalAlert">Offline</div>) : (null)}
            </React.Fragment>
        );
    }
}
