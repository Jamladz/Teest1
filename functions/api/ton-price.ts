export async function onRequest(context: any) {
  let cachedTonPrice = 7.25;
  const apiKey = context.env.COINGECKO_API_KEY || "CG-vfjcWe7Y9Me2DYSDMrCqBqfC";

  try {
    let url = `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`;
    let response = await fetch(url, {
      headers: apiKey ? { "x-cg-demo-api-key": apiKey } : {}
    });

    if (!response.ok && response.status === 401) {
      url = `https://pro-api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`;
      response = await fetch(url, {
        headers: apiKey ? { "x-cg-pro-api-key": apiKey } : {}
      });
    }

    if (!response.ok && response.status === 401) {
      url = `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`;
      response = await fetch(url);
    }

    if (response.ok) {
      const data = await response.json();
      if (data["the-open-network"] && data["the-open-network"].usd) {
        cachedTonPrice = data["the-open-network"].usd;
      }
    }
  } catch (e) {
    console.error(e);
  }

  return new Response(JSON.stringify({ price: cachedTonPrice }), {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}
