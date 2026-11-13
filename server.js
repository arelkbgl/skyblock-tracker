// HTTP server for the Bazaar Tracker.
//
// Routes:
//   GET /                    Dashboard (dashboard.html)
//   GET /items               Item Overview (items.html)
//   GET /images/<file>       Image files from the images/ folder
//   GET /chart?item=<id>     Price chart page (chart.html)
//   GET /history?item=<id>   Price history of one item as JSON: [{ time, buy, sell }]
//
// Usage: node server.js

const http = require("http");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const db = new DatabaseSync("prices.db");
const selectHistory = db.prepare("SELECT time, buy, sell FROM prices WHERE item = ? ORDER BY time");

// File extension → Content-Type, so the browser knows how to read each image.
const imageTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml"
};

const server = http.createServer((request, response) => {
    console.log(request.url);

    // request.url only holds the path and query, so URL() needs a base to parse it.
    const url = new URL(request.url, "http://localhost");

    if (url.pathname === "/") {
        const html = fs.readFileSync("dashboard.html");
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(html);

    } else if (url.pathname === "/history") {
        const item = url.searchParams.get("item");
        const history = selectHistory.all(item);

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(history));

    } else if (url.pathname === "/chart") {
        const html = fs.readFileSync("chart.html");
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(html);
    
    } else if (url.pathname === "/items") {
        const html = fs.readFileSync("items.html");
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(html);

    } else if (url.pathname.startsWith("/images/")) {
        // basename() keeps only the file name, so "/images/../prices.db" can't reach files outside images/.
        const fileName = path.basename(url.pathname);
        const type = imageTypes[path.extname(fileName).toLowerCase()];

        if (type === undefined || !fs.existsSync("images/" + fileName)) {
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.end("Image not found");
        }  else {
            const image = fs.readFileSync("images/" + fileName);
            response.writeHead(200, { "Content-Type": type });
            response.end(image);
        }
    } else {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.end("Page not found");
    }
});

server.listen(3000);
console.log("Server running at http://localhost:3000");
