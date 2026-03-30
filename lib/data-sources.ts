import YahooFinance from "yahoo-finance2";
import { EMPTY_MACRO_CARDS } from "@/lib/constants";
import { MetricCard } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";

const FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations";
const NEWS_QUERY =
  '("gold market" OR bitcoin OR "treasury yield" OR "Iran oil" OR "federal reserve")';
const yahooFinance = new YahooFinance();

interface FredObservationResponse {
  observations: Array<{
    date: string;
    value: string;
  }>;
}

interface NewsApiResponse {
  articles: Array<{
    source?: { name?: string };
    title: string;
    url: string;
    publishedAt: string;
    description?: string;
  }>;
}

interface FearGreedResponse {
  fear_and_greed?: {
    score?: number;
    rating?: string;
    timestamp?: string;
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${url}`);
  }

  return response.json() as Promise<T>;
}

async function getFredLatest(seriesId: string) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error("FRED_API_KEY is missing");
  }

  const url = `${FRED_BASE_URL}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`;
  const data = await fetchJson<FredObservationResponse>(url);
  const latest = data.observations.find((item) => item.value !== ".");

  if (!latest) {
    throw new Error(`No FRED observation for ${seriesId}`);
  }

  return {
    value: Number(latest.value),
    date: latest.date
  };
}

async function getYahooQuote(symbol: string) {
  const quote = await yahooFinance.quote(symbol);
  return {
    value: typeof quote.regularMarketPrice === "number" ? quote.regularMarketPrice : null,
    change: typeof quote.regularMarketChangePercent === "number" ? quote.regularMarketChangePercent : null
  };
}

async function getFearGreed() {
  const data = await fetchJson<FearGreedResponse>(
    "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
  );

  return {
    value: data.fear_and_greed?.score ?? null,
    rating: data.fear_and_greed?.rating ?? "",
    timestamp: data.fear_and_greed?.timestamp
  };
}

async function getCoinGeckoSnapshot() {
  const data = await fetchJson<Record<string, { usd: number }>>(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,gold&vs_currencies=usd"
  );

  return {
    bitcoin: data.bitcoin?.usd ?? null,
    gold: data.gold?.usd ?? null
  };
}

async function getBtcFundingRate() {
  const data = await fetchJson<{ lastFundingRate?: string; time?: number }>(
    "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT"
  );

  return {
    value: data.lastFundingRate ? Number(data.lastFundingRate) * 100 : null,
    updatedAt: data.time ? new Date(data.time).toISOString() : undefined
  };
}

export async function getNewsHeadlines() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error("NEWS_API_KEY is missing");
  }

  const params = new URLSearchParams({
    q: NEWS_QUERY,
    language: "en",
    sortBy: "publishedAt",
    pageSize: "8",
    apiKey
  });

  const data = await fetchJson<NewsApiResponse>(
    `https://newsapi.org/v2/everything?${params.toString()}`
  );

  return data.articles.map((article) => ({
    title: article.title,
    source: article.source?.name ?? "NewsAPI",
    publishedAt: article.publishedAt,
    url: article.url,
    description: article.description ?? ""
  }));
}

export async function getMacroSnapshot() {
  const [dgs2, dgs10, dgs30, vix, dxy, wti, spFutures, fearGreed, coinGecko, btcFunding] =
    await Promise.all([
      getFredLatest("DGS2"),
      getFredLatest("DGS10"),
      getFredLatest("DGS30"),
      getYahooQuote("^VIX"),
      getYahooQuote("DX-Y.NYB"),
      getYahooQuote("CL=F"),
      getYahooQuote("ES=F"),
      getFearGreed(),
      getCoinGeckoSnapshot(),
      getBtcFundingRate()
    ]);

  const spread = dgs10.value - dgs2.value;
  const spreadBps = spread * 100;

  const cards: MetricCard[] = EMPTY_MACRO_CARDS.map((card) => {
    switch (card.key) {
      case "dgs2":
        return { ...card, value: dgs2.value, displayValue: formatPercent(dgs2.value), updatedAt: dgs2.date };
      case "dgs10":
        return { ...card, value: dgs10.value, displayValue: formatPercent(dgs10.value), updatedAt: dgs10.date };
      case "dgs30":
        return { ...card, value: dgs30.value, displayValue: formatPercent(dgs30.value), updatedAt: dgs30.date };
      case "spread_2s10s":
        return { ...card, value: spreadBps, displayValue: `${spreadBps.toFixed(1)}bp`, updatedAt: new Date().toISOString() };
      case "vix":
        return { ...card, value: vix.value, change: vix.change, displayValue: formatNumber(vix.value), updatedAt: new Date().toISOString() };
      case "dxy":
        return { ...card, value: dxy.value, change: dxy.change, displayValue: formatNumber(dxy.value), updatedAt: new Date().toISOString() };
      case "wti":
        return { ...card, value: wti.value, change: wti.change, displayValue: `$${formatNumber(wti.value)}`, updatedAt: new Date().toISOString() };
      case "fear_greed":
        return {
          ...card,
          value: fearGreed.value,
          displayValue: `${formatNumber(fearGreed.value, { maximumFractionDigits: 0 })}${fearGreed.rating ? ` · ${fearGreed.rating}` : ""}`,
          updatedAt: fearGreed.timestamp
        };
      case "sp_futures":
        return { ...card, value: spFutures.value, change: spFutures.change, displayValue: formatNumber(spFutures.value), updatedAt: new Date().toISOString() };
      default:
        return card;
    }
  });

  return {
    cards,
    raw: {
      rates: { dgs2, dgs10, dgs30, spread2s10s: spread },
      market: { vix, dxy, wti, spFutures },
      sentiment: fearGreed,
      crypto: { ...coinGecko, btcFunding }
    }
  };
}
