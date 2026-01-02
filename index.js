const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================================
   🔧 CONFIG
================================ */
const PLACE_ID = "104524115833006"; // YOUR PLACE ID
const CACHE_DURATION_MS = 60 * 1000;

/* ================================
   🧠 CACHE
================================ */
let cachedServers = {
  data: [],
  message: "No data cached yet."
};
let lastFetchTime = 0;

/* ================================
   ✅ HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("✅ Roblox Server Proxy is running!");
});

/* ================================
   🌍 SERVER LIST ENDPOINT
================================ */
app.get("/servers", async (req, res) => {
  const now = Date.now();

  // Serve cached data
  if (cachedServers.data.length > 0 && now - lastFetchTime < CACHE_DURATION_MS) {
    return res.json({
      ...cachedServers,
      cached: true,
      message: "Serving cached data (fresh).",
    });
  }

  try {
    const url = `https://games.roblox.com/v1/games/${PLACE_ID}/servers/Public?sortOrder=Asc&limit=100`;
    const response = await fetch(url);

    if (response.status === 429) {
      console.warn("⚠️ Roblox rate limited");
      return res.json({
        ...cachedServers,
        cached: true,
        message: "Rate limited — using cached data.",
      });
    }

    if (!response.ok) {
      throw new Error(`Roblox API error: ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data.data)) {
      cachedServers = data;
      lastFetchTime = now;

      return res.json({
        ...data,
        cached: false,
        message: "Fresh server data fetched.",
      });
    }

    return res.json({
      ...cachedServers,
      cached: true,
      message: "Unexpected response format.",
    });

  } catch (err) {
    console.error("❌ Fetch error:", err.message);

    return res.json({
      ...cachedServers,
      cached: true,
      message: "Error fetching servers — using cached data.",
    });
  }
});

/* ================================
   🚀 START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
