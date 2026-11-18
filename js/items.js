const rows = [];
const searchInput = document.getElementById("search");
const headers = document.querySelectorAll("th");

let sortKey = "marginPercent";
let sortDescending = true;

function addCell(tr, text) {
    const td = document.createElement("td");
    td.textContent = text;
    tr.append(td);
}

// Fetches the live Bazaar data once and builds the row list.
async function loadBazaar() {
    const response = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");
    const data = await response.json();
    const items = Object.keys(data.products);

    for (const itemId of items) {
        const product = data.products[itemId];
        const status = product.quick_status;
        
        // Top order, not quick_status: its average can be skewed by a few cheap orders.
        const buyPrice = product.buy_summary.length > 0 ? product.buy_summary[0].pricePerUnit : 0;
        const sellPrice = product.sell_summary.length > 0 ? product.sell_summary[0].pricePerUnit : 0;

        // Only the smaller side can actually fill, so it limits a flip.
        const weeklyVolume = Math.min(status.buyMovingWeek, status.sellMovingWeek);

        // Hide items with an empty order book side or too little volume to flip.
        if (buyPrice !== 0 && sellPrice !== 0 && weeklyVolume >= 100_000) {
            // Flip: buy order at sellPrice, sell offer at buyPrice.
            const margin = buyPrice - sellPrice;
            const marginPercent = margin / sellPrice * 100;

            const row = {
                id: itemId,
                name: prettyName(itemId),
                buyPrice: buyPrice,
                sellPrice: sellPrice,
                margin: margin,
                marginPercent: marginPercent,
                weeklyVolume: weeklyVolume
            };
            rows.push(row);
        }
    }

    renderTable("");
}

// Redraws the table from `rows`, applying the search filter and current sort.
function renderTable(search) {
    // Ignore case and spaces so "ench dia" style input still matches.
    const lowerSearch = search.toLowerCase().replaceAll(" ", "");
    const render = [];
    const tableBody = document.getElementById("item-table");
    tableBody.textContent = "";

    for (const row of rows) {
        if (row.name.toLowerCase().replaceAll(" ", "").includes(lowerSearch)) {
            render.push(row);
        }
    }

    // Moves the sort arrow to the active column; runs on load too, so the default sort shows one.
    for (const th of headers) {
        th.classList.remove("sort-desc");
        th.classList.remove("sort-asc");
        if (th.dataset.key === sortKey) {
            if (sortDescending) {
                th.classList.add("sort-desc");
            } else {
                th.classList.add("sort-asc");
            }
        }
    }

    if (sortKey === "name") {
        // For names, "descending" means A→Z so the first click sorts alphabetically.
        if (sortDescending) {
            render.sort((a, b) => a[sortKey].localeCompare(b[sortKey]));
        } else {
            render.sort((a, b) => b[sortKey].localeCompare(a[sortKey]));
        }
    } else {
        if (sortDescending) {
            render.sort((a, b) => b[sortKey] - a[sortKey]);
        } else {
            render.sort((a, b) => a[sortKey] - b[sortKey]);
        }
    }

    for (const row of render) {
        const tr = document.createElement("tr");

        const td = document.createElement("td");
        const link = document.createElement("a");
        link.href = "/chart?item=" + row.id;
        link.textContent = row.name;
        td.append(link);
        tr.append(td);

        addCell(tr, shortNumber(row.buyPrice));
        addCell(tr, shortNumber(row.sellPrice));
        addCell(tr, shortNumber(row.margin));
        addCell(tr, row.marginPercent.toLocaleString("en-US", { maximumFractionDigits: 0 }) + "%");
        addCell(tr, shortNumber(row.weeklyVolume));

        tableBody.append(tr);
    }
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

// Clicking the active column flips the direction; a new column starts descending.
for (const th of headers) {
    th.addEventListener("click", () => {
        if (th.dataset.key === sortKey) {
            sortDescending = !sortDescending;
        } else {
            sortKey = th.dataset.key;
            sortDescending = true;
        }
        renderTable(searchInput.value);
    });
}

searchInput.addEventListener("input", () => {
    renderTable(searchInput.value);
});

loadBazaar();
