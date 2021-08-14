//const { createServer } = require("https");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const httpsOptions = {
    //key: fs.readFileSync("../../ssl.key"),
    //cert: fs.readFileSync("../../ssl.cert"),
};
app.prepare().then(() => {
    createServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(3000, (err) => {
        if (err) throw err
        console.log('> Custom server ready on http://localhost:3000')
    })
})
