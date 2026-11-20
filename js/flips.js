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

function fillCategory(section, top) {

    section.querySelector(".updated").textContent = "Updated " + timeAgo(top[0].time);
    section.querySelector(".featured-name").textContent = top[0].name;
    section.querySelector(".stat-buy").textContent = shortNumber(top[0].orderPrice);
    section.querySelector(".stat-sell").textContent = shortNumber(top[0].offerPrice);
    section.querySelector(".stat-profit").textContent = "+" + shortNumber(top[0].marginAfterTax) + " (" + Math.round(top[0].marginPercent) + "%)";
    section.querySelector(".stat-volume").textContent = shortNumber(top[0].itemsPerHour * 168);

    drawMiniChart(section.querySelector("canvas"), top[0].id);

    const tbody = section.querySelector(".category-table tbody");

    for (let i = 1; i < top.length; i++) {
        const row = document.createElement("tr");
        const item = top[i];

        row.innerHTML = `
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${shortNumber(item.orderPrice)}</td>
        <td>${shortNumber(item.offerPrice)}</td>
        <td class="profit">${shortNumber(item.marginAfterTax)}</td>
        <td>${shortNumber(item.itemsPerHour * 168)}</td>`;
        
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

async function loadPage() {
    const items = await fetchItems();

    fillCategory(document.querySelector("#best-flips"), bestBazaarFlips(items));
    fillCategory(document.querySelector("#budget-flips"), budgetFlips(items));
}

loadPage();
