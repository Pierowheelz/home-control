import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
    render() {
        return (
            <Html lang="en">
                <Head>
                    <meta charSet="utf-8" />
                    <meta name="theme-color" content="#000000" />
                    {/* Fonts and icons */}
                    <link
                        href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700"
                        rel="stylesheet"
                    />
                    <link rel="manifest" href={process.env.PUBLIC_URL+'manifest.json'} />
                    <link rel="shortcut icon" href={process.env.PUBLIC_URL+'favicon.ico'} />
                </Head>
                <body className="g-sidenav-hidden">
                    <div id="page-transition"></div>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
