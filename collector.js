// Polls the Hypixel Bazaar API every 5 minutes and stores a price snapshot
// for every active product in prices.db.
//
// Usage: node collector.js

const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync("prices.db");
db.exec("CREATE TABLE IF NOT EXISTS prices (time TEXT, item TEXT, buy REAL, sell REAL)");
db.exec("CREATE INDEX IF NOT EXISTS idx_item_time ON prices (item, time)");
db.exec(`CREATE TABLE IF NOT EXISTS latest (
    item TEXT PRIMARY KEY,
    time TEXT,
    orderPrice REAL,
    offerPrice REAL,
    buyMovingWeek INTEGER,
    sellMovingWeek INTEGER,
    buyOrders INTEGER,
    sellOrders INTEGER
)`);

const insert = db.prepare("INSERT INTO prices (time, item, buy, sell) VALUES (?, ?, ?, ?)");
const upsertLatest = db.prepare(`INSERT OR REPLACE INTO latest
    (item, time, orderPrice, offerPrice, buyMovingWeek, sellMovingWeek, buyOrders, sellOrders)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const deleteStale = db.prepare("DELETE FROM latest WHERE time != ?");

async function collect() {
    try {
        const response = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");
        const data = await response.json();

        // Use Hypixel's snapshot time so every row from one fetch shares the same timestamp.
        const time = new Date(data.lastUpdated).toISOString();
        const items = Object.keys(data.products);
        let count = 0;

        db.exec("BEGIN");
        for (const itemId of items) {
            const product = data.products[itemId];

            // Top order, not quick_status: its average can be skewed by a few cheap orders.
            const buyPrice = product.buy_summary.length > 0 ? product.buy_summary[0].pricePerUnit : 0;
            const sellPrice = product.sell_summary.length > 0 ? product.sell_summary[0].pricePerUnit : 0;

            // A price of 0 means one side of the order book is empty.
            if (buyPrice !== 0 && sellPrice !== 0) {
                insert.run(time, itemId, buyPrice, sellPrice);
                count++;

                const status = product.quick_status;
                upsertLatest.run(
                    itemId, time,
                    sellPrice,   // orderPrice: the low price, where buy orders sit
                    buyPrice,    // offerPrice: the high price, where sell offers sit
                    status.buyMovingWeek, status.sellMovingWeek,
                    status.buyOrders, status.sellOrders
                );
            }
        }
        deleteStale.run(time);
        db.exec("COMMIT");

        console.log("Saved " + count + " items at " + time);
    } catch (error) {
        if (db.isTransaction) {
            db.exec("ROLLBACK");
        }
        console.error("Collect failed at " + new Date().toISOString() + ": " + error.message);
    }
}

collect();
setInterval(collect, 300_000);
