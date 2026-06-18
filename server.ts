import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware if needed
  app.use(express.json());

  // API constraints
  let cachedTonPrice = 7.25;
  let lastPriceFetch = 0;

  app.get("/api/ton-price", async (req, res) => {
    try {
      // CoinGecko rate limiting mitigation: cache result for 2 minutes
      const now = Date.now();
      if (now - lastPriceFetch > 120000) {
        const apiKey = process.env.COINGECKO_API_KEY || "CG-vfjcWe7Y9Me2DYSDMrCqBqfC";
        
        // Try public API with demo key in headers
        let url = `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`;
        let response = await fetch(url, {
          headers: apiKey ? { "x-cg-demo-api-key": apiKey } : {}
        });
        
        if (!response.ok && response.status === 401) {
            // Try pro endpoint
            url = `https://pro-api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`;
            response = await fetch(url, {
              headers: apiKey ? { "x-cg-pro-api-key": apiKey } : {}
            });
        }
        
        if (!response.ok && response.status === 401) {
            // Try without any key as a last resort
            url = `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`;
            response = await fetch(url);
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data["the-open-network"] && data["the-open-network"].usd) {
            cachedTonPrice = data["the-open-network"].usd;
            lastPriceFetch = now;
          }
        } else {
            console.error("CoinGecko fetch failed:", response.status, await response.text());
        }
      }
      res.json({ price: cachedTonPrice });
    } catch (e) {
      console.error(e);
      res.json({ price: cachedTonPrice }); // fallback
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
