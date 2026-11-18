// Draws a small price chart for one item inside the given canvas.
async function drawMiniChart(canvasId, itemId) {
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

    new Chart(document.getElementById(canvasId), {
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

drawMiniChart("featured-chart", "ENCHANTED_DIAMOND");