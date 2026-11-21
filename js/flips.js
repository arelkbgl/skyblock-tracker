// Draws a small price chart for one item inside the given canvas.
async function drawMiniChart(canvas, itemId) {
    const response = await fetch("/history?item=" + itemId);
    const history = await response.json();

    const labels = [];
    const buyPrices = [];
    const sellPrices = [];

    for (const entry of history) {
        labels.push(entry.time);
        buyPrices.push(entry.buy);
        sellPrices.push(entry.sell);
    }

    const old = Chart.getChart(canvas);
    if (old) {
        old.destroy();
    }

    new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                { data: buyPrices, borderColor: "#35E58C" },
                { data: sellPrices, borderColor: "#A7B0AA" }
            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                point: { radius: 0 },
                line: { borderWidth: 2, tension: 0.3 }
            }
        }
    });
}

function fillCategory(section, top, getStats) {
    const statsFeatured = getStats(top[0]);

    section.querySelector(".updated").textContent = "Updated " + timeAgo(top[0].time);
    section.querySelector(".featured-name").textContent = statsFeatured.name;
    section.querySelector(".stat-buy").textContent = shortNumber(statsFeatured.buy);
    section.querySelector(".stat-sell").textContent = shortNumber(statsFeatured.sell);
    section.querySelector(".stat-profit").textContent = "+" + shortNumber(statsFeatured.margin) + " (" + Math.round(statsFeatured.marginPercent) + "%)";
    section.querySelector(".stat-volume").textContent = shortNumber(statsFeatured.volume);

    drawMiniChart(section.querySelector("canvas"), top[0].id);

    const tbody = section.querySelector(".category-table tbody");
    tbody.innerHTML = "";

    for (let i = 1; i < top.length; i++) {
        const stats = getStats(top[i]);
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${i + 1}</td>
        <td>${stats.name}</td>
        <td>${shortNumber(stats.buy)}</td>
        <td>${shortNumber(stats.sell)}</td>
        <td class="profit">${shortNumber(stats.margin)}</td>
        <td>${shortNumber(stats.volume)}</td>`;
        
        tbody.append(row);
    }
}

function bestBazaarFlips(list) {
    const good = list.filter(item => item.marginPercent >= 2
        && item.itemsPerHour >= 1000)
        .sort((a,b) => b.profitPerHour - a.profitPerHour);
    
    const top5 = good.slice(0,5);
    return top5;
}

function budgetFlips(list) {
    const good = list.filter(item => item.marginPercent >= 2
        && item.itemsPerHour >= 1000
        && item.orderPrice <= 1000)
        .sort((a,b) => b.profitPerHour - a.profitPerHour);

    const top5 = good.slice(0,5);
    return top5;
}

function flipStats(item) {
    return {
        name: item.name,
        buy: item.orderPrice,
        sell: item.offerPrice,
        margin: item.marginAfterTax,
        marginPercent: item.marginPercent,
        volume: item.itemsPerHour * 168
    };
}

// insta = false: buy order → NPC (cheaper, but you wait for the order to fill)
// insta = true:  insta-buy → NPC (instant, smaller profit)
function npcFlips(list, insta) {
    let profitField = "npcProfit";
    let perHourField = "npcProfitPerHour";
    let volumeField = "sellMovingWeek";
    if (insta) {
        profitField = "npcProfitInsta";
        perHourField = "npcProfitInstaPerHour";
        volumeField = "buyMovingWeek";
    }

    // null > 0 is false, so items without an NPC price drop out here.
    const good = list.filter(item => item[profitField] > 0
        && item[volumeField] >= 1000)
        .sort((a,b) => b[perHourField] - a[perHourField]);

    const top5 = good.slice(0,5);
    return top5;
}

function npcStats(item) {
    return {
        name: item.name,
        buy: item.orderPrice,
        sell: item.npcPrice,
        margin: item.npcProfit,
        marginPercent: item.npcProfitPercent,
        volume: item.sellMovingWeek
    };
}

function npcStatsInsta(item) {
    return {
        name: item.name,
        buy: item.offerPrice,
        sell: item.npcPrice,
        margin: item.npcProfitInsta,
        marginPercent: item.npcProfitInstaPercent,
        volume: item.buyMovingWeek
    };
}

async function loadPage() {
    const items = await fetchItems();

    fillCategory(document.querySelector("#best-flips"), bestBazaarFlips(items), flipStats);
    fillCategory(document.querySelector("#budget-flips"), budgetFlips(items), flipStats);
    // Insta version: npcFlips(items, true) with npcStatsInsta
    fillCategory(document.querySelector("#npc-flips"), npcFlips(items, true), npcStatsInsta);

    const npcSection = document.querySelector("#npc-flips");
    const buttons = npcSection.querySelectorAll("button");
    const active = npcSection.querySelector("#active");

    for (const button of buttons) {
        button.addEventListener("click", () => {
            for (const b of buttons) {
                b.classList.remove("active");
            }
            button.classList.add("active");

            if (button.dataset.mode === "insta") {
                fillCategory(document.querySelector("#npc-flips"), npcFlips(items,true), npcStatsInsta);
            } 
            
            if (button.dataset.mode === "order") {
                fillCategory(document.querySelector("#npc-flips"), npcFlips(items,false), npcStats);
            }
        });
    }
}

loadPage();
