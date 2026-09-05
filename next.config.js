const withPlugins = require("next-compose-plugins");
const withFonts = require("next-fonts");
const webpack = require("webpack");
const path = require("path");
const runtimeCaching = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching,
  fallbacks: {
    document: '/_.html',
  },
  // Avoid GenerateSW-called-multiple-times noise in `next dev` watch mode
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA(withFonts(
    {
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
            //'api_bak_url': process.env.REACT_APP_ENDPOINT_URL_BAK
            // strings so webpack inlining does not turn false into `false !== 'false'`
            'use_proxy': process.env.USE_PROXY === 'false' ? 'false' : 'true',
        }
    }
));
