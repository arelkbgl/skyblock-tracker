// HTTP server for the Bazaar Tracker.
//
// Routes:
//   GET /                    Dashboard (dashboard.html)
//   GET /items               Item Overview (items.html)
//   GET /chart?item=<id>     Price chart page (chart.html)
//   GET /history?item=<id>   Price history of one item as JSON: [{ time, buy, sell }]
//
// Usage: node server.js

const http = require("http");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("prices.db");
const selectHistory = db.prepare("SELECT time, buy, sell FROM prices WHERE item = ? ORDER BY time");

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

    } else {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.end("Page not found");
    }
});

server.listen(3000);
console.log("Server running at http://localhost:3000");
