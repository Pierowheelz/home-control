const withPlugins = require("next-compose-plugins");
const withImages = require("next-images");
const withFonts = require("next-fonts");
const webpack = require("webpack");
const path = require("path");
const withPWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');

module.exports = withPWA(withFonts(
    withImages({
        webpack(config, options) {
            config.module.rules.push({
                test: /\.(eot|ttf|woff|woff2)$/,
                use: {
                    loader: "url-loader",
                },
            });
            config.resolve.modules.push(path.resolve("./"));
            return config;
        },
        future: {
           webpack5: true,
        },
        env: {
            'public_url': process.env.PUBLIC_URL,
            'api_url': process.env.REACT_APP_ENDPOINT_URL,
        },
        pwa: {
            dest: 'public',
            runtimeCaching,
        },
    })
));
