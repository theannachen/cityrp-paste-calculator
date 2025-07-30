const uuid = "a3dc421f-865a-4215-8aa7-be392e357b3f"
const apiKey = process.env.API_KEY;
const url = "https://api.cityrp.org/citycorp"
const fs = require("fs");

const headers = {
    Authorization: `Basic ${Buffer.from(uuid + ":" + apiKey).toString("base64")}`,
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchWithRetry(url, retries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            if (attempt === retries) throw err;
            await sleep(delay);
        }
    }
}

async function getAllCommodities() {
    const oldJSON = require("./AllCommodityItems.json");
    const oldLength = oldJSON.length;

    const firstPage = await fetchWithRetry(`${url}/commodity/list`);
    let allItems = [];

    if (firstPage.totalCommodities !== oldLength) {
        for (let i = 1; i <= firstPage.totalPages; ++i) {
            const pageData = await fetchWithRetry(`${url}/commodity/list?page=${i}`);
            allItems.push(...pageData.commodities.map((item) => item.name));
        }

        fs.writeFileSync("AllCommodityItems.json", JSON.stringify(allItems, null, 2));
        console.log(`Updated commodity list with ${allItems.length} items.`);
    } else {
        allItems = oldJSON;
        console.log(`Loaded ${allItems.length} commodities from cache.`);
    }

    return allItems;
}

function formatTime(ms) {
    const sec = Math.floor((ms / 1000) % 60);
    const min = Math.floor((ms / 1000 / 60) % 60);
    return `${min}m ${sec}s`;
}

async function fetchCommodityPrices(items) {
    const batchSize = 2;
    const total = items.length;
    const results = [];

    const startTime = Date.now();

    for (let i = 0; i < total; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        const responses = await Promise.all(
            batch.map((item) =>
                fetchWithRetry(`${url}/commodity?item_name=${encodeURIComponent(item)}&search_time=MONTH`)
                    .then((json) => ({ item, json }))
                    .catch((err) => ({ item, error: err.message }))
            )
        );

        for (const res of responses) {
            if (res.error) {
                console.warn(`Failed: ${res.item}: ${res.error}`);
            } else {
                results.push(res.json);
            }
        }

        const percent = ((i + batchSize) / total * 100).toFixed(2);
        const elapsed = Date.now() - startTime;
        console.log(`Progress [${i + batchSize}/${total}] ${percent}%`);

        if (i + batchSize < total) {
            await sleep(12_000); // 2 requests per 12 seconds = 10 per minute
        }
    }

    fs.writeFileSync("AllPrices.json", JSON.stringify(results, null, 2));
    console.log(`Saved AllPrices.json with ${results.length} entries.`);
}

(async () => {
    try {
        const items = await getAllCommodities();
        await fetchCommodityPrices(items);
        console.log("Done.");
    } catch (err) {
        console.error("Fatal error:", err);
    }
})();
