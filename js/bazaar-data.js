// Shared Bazaar data for all pages.
// Fetches the latest snapshot from /api/items and adds calculated values.
const TAX = 0.015;

async function fetchItems() {
    const response = await fetch("/api/items");
    const rows = await response.json();

    const items = [];

    for (const row of rows) {
        const margin = row.offerPrice - row.orderPrice;
        const marginPercent = margin / row.orderPrice * 100;
        const marginAfterTax = row.offerPrice * (1 - TAX) - row.orderPrice;
        const itemsPerHour = Math.min(row.buyMovingWeek, row.sellMovingWeek) / 168;
        const profitPerHour = marginAfterTax * itemsPerHour;
        
        const item = {
            id: row.item,
            name: prettyName(row.item),
            time: row.time,
            orderPrice: shortNumber(row.orderPrice),
            offerPrice: shortNumber(row.offerPrice),
            buyMovingWeek: shortNumber(row.buyMovingWeek),
            sellMovingWeek: shortNumber(row.sellMovingWeek),
            buyOrders: shortNumber(row.buyOrders),
            sellOrders: shortNumber(row.sellOrders),
            itemsPerHour: shortNumber(itemsPerHour),
            margin: shortNumber(margin),
            marginPercent: shortNumber(marginPercent),
            marginAfterTax: shortNumber(marginAfterTax),
            profitPerHour: shortNumber(profitPerHour),
        };
        items.push(item); 
    }
    return items;
}

// "ENCHANTED_DIAMOND" → "Enchanted Diamond"
function prettyName(id) {
    const lower = id.toLowerCase().split("_");
    const fixed = [];

    for (const word of lower) {
        const pretty = word.charAt(0).toUpperCase() + word.slice(1);
        fixed.push(pretty);
    }

    return fixed.join(" ");
}

// 2448449 → "2.4M". Display only; rows keep raw numbers so sorting stays correct.
function shortNumber(n) {
    if (n >= 1_000_000_000) {
        return (n / 1_000_000_000).toFixed(1) + "B";
    } else if (n >= 1_000_000) {
        return (n / 1_000_000).toFixed(1) + "M";
    } else if (n >= 1_000) {
        return (n / 1_000).toFixed(1) + "k";
    } else {
        return n.toFixed(1);
    }
}