#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const uuid = "a3dc421f-865a-4215-8aa7-be392e357b3f";
const apiKey = process.env.API_KEY;
const url = "https://api.cityrp.org/citycorp";

if (!apiKey) {
  console.error("Missing API_KEY env variable");
  process.exit(1);
}

const headers = {
  Authorization: `Basic ${Buffer.from(uuid + ":" + apiKey).toString("base64")}`,
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchWithRetry(url, retries = 5, delay = 2500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Attempt ${attempt}/${retries} failed → ${err.message}`);
      if (attempt === retries) throw err;
      await sleep(delay);
    }
  }
}

async function getAllCommodities() {
  const commoditiesFile = path.join("data", "commodities.json");
  let saved = [];

  if (fs.existsSync(commoditiesFile)) {
    saved = JSON.parse(fs.readFileSync(commoditiesFile));
  }

  const firstPage = await fetchWithRetry(`${url}/commodity/list`);

  if (firstPage.totalCommodities !== saved.length) {
    console.log("Commodity count changed — refreshing full list");

    let allItems = [];
    for (let i = 1; i <= firstPage.totalPages; ++i) {
      const page = await fetchWithRetry(`${url}/commodity/list?page=${i}`);
      allItems.push(...page.commodities.map((c) => c.name));
    }

    fs.writeFileSync(commoditiesFile, JSON.stringify(allItems, null, 2));
    return allItems;
  }

  console.log(`Loaded ${saved.length} commodities from cache`);
  return saved;
}

function toCSV(data) {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    csvRows.push(
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
    );
  }
  return csvRows.join("\n");
}

async function fetchPricesToday(items) {
  const batchSize = 2;
  const results = [];
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join("data", date);

  // Create daily folder
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log(`Fetching price data for ${date}`);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const response = await Promise.all(
      batch.map((item) =>
        fetchWithRetry(
          `${url}/commodity?item_name=${encodeURIComponent(item)}&search_time=DAY`
        )
          .then((json) => ({ item, json }))
          .catch((err) => ({ item, error: err.message }))
      )
    );

    for (const r of response) {
      if (!r.error) results.push(r.json);
      else console.warn(`Failed: ${r.item} → ${r.error}`);
    }

    if (i + batchSize < items.length) await sleep(12_000);
  }

  // Save JSON snapshot
  const jsonPath = path.join(dir, "snapshot.json");
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Saved JSON → ${jsonPath}`);

  // Save CSV snapshot
  const flat = results.map((r) => ({
    item_name: r.item_name,
    average_price: r.average_price,
    lowest_price: r.lowest_price,
    highest_price: r.highest_price,
    num_sales: r.num_sales,
    volume: r.volume,
    timestamp: r.timestamp,
  }));

  const csvPath = path.join(dir, "snapshot.csv");
  fs.writeFileSync(csvPath, toCSV(flat));
  console.log(`Saved CSV → ${csvPath}`);
}

(async () => {
  try {
    const items = await getAllCommodities();
    await fetchPricesToday(items);
    console.log("Done");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
})();
