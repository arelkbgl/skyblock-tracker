# Bazaar Tracker

A web app for tracking the Hypixel SkyBlock Bazaar. It shows live prices with flip margins, and it records price history so you can see how items move over time.

## Features

- **Live Bazaar table:** buy and sell prices, margin, margin %, and weekly trade volume for every active item
- **Search:** filter items by name. Upper/lower case and spaces don't matter.
- **Sorting:** click any column header to sort, and click again to reverse
- **Volume filter:** hides items that barely trade, where a big margin would never actually fill
- **Price history:** a background collector saves a snapshot of every item every 5 minutes
- **Charts:** click an item to see its buy/sell price history as a line chart

## How it works

The project has three parts:

- **`collector.js`:** polls the Hypixel Bazaar API every 5 minutes and stores the prices in a SQLite database (`prices.db`).
- **`server.js`:** a Node.js HTTP server that serves the pages and a small JSON API (`/history?item=<id>`) that reads from the database.
- **`bazaartracker.html` / `chart.html`:** the frontend. The table loads live data from the Hypixel API, and the chart page loads saved history from the server and draws it with Chart.js.

## Getting started

Requires [Node.js](https://nodejs.org/) 22 or newer (uses the built-in `node:sqlite` module). There are no dependencies to install.

Start the collector in one terminal:

```bash
node collector.js
```

Start the server in a second terminal:

```bash
node server.js
```

Then open http://localhost:3000 in your browser.

History builds up while the collector is running, so charts fill in over time.

## Built with

- JavaScript (Node.js)
- SQLite (`node:sqlite`)
- [Chart.js](https://www.chartjs.org/)
- [Hypixel API](https://api.hypixel.net/)

## Plans

- Auction House tracking
- Run the collector 24/7 on a server
- Time range options for charts (last 24h, 7 days, ...)
