## Home Control App
A ReactJS webapp based on the NextJS Argon Dashboard PRO boilderplate from Creative Tim. Uses NextJS for routing.

After login the app loads pages, nav, and device cards from the backend (`GET /layout`, driven by `appLayout` / `devices` in `env.config.js`). Auth still lives under `pages/auth`. Everything else is a catch-all (`pages/[page].js`) plus the Apache rewrite in `public/.htaccess`.

To add a room, hide the garage, or change who sees which page, edit the backend config and restart the API. See the backend README (Devices and app layout). A frontend rebuild is only needed if you add a new widget type in code.

#### Development Quick Start

*   Install NodeJS **LTS** version from [NodeJs Official Page](https://nodejs.org/en/)
*   Pull the latest version from Bitbucket
*   Open Terminal
*   Go to your file project (where you’ve unzipped the product)
*   Run in terminal `npm install`
*   Then run `npm run dev`
*   Or you can simply run `npm run install:clean` (if you use a linux based terminal) which will install `node_modules` and also will start your project.
*   If you have an error something containing **Module not found** please make sure `next.config.js`, `pages/_app.js` and `pages/_document.js` files are configured correctly
*   Navigate to [https://localhost:3000](https://localhost:3000)


## Documentation
Documentation for the NextJS Argon Dashboard PRO boilderplate is found [here](https://www.creative-tim.com/learning-lab/nextjs/overview/argon-dashboard).
Documentation for NectJS is found [here](https://nextjs.org/docs/getting-started).


## Resources
- Argon Documentation: <https://www.creative-tim.com/learning-lab/nextjs/overview/argon-dashboard?ref=njsadp-github-readme>
- NextJS Documentation: <https://nextjs.org/docs/getting-started>
- Argon Download Page: <https://www.creative-tim.com/product/nextjs-argon-dashboard-pro?ref=njsadp-github-readme>
- License Agreement (with Creative Tim): <https://www.creative-tim.com/license?ref=njsadp-github-readme>
