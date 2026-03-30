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

interface MacroSourceError {
  source: string;
  message: string;
}

type MacroCardKey = (typeof EMPTY_MACRO_CARDS)[number]["key"];

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

function metricCardFallback(key: MacroCardKey, message: string) {
  const base = EMPTY_MACRO_CARDS.find((card) => card.key === key);

  if (!base) {
    throw new Error(`Unknown macro card: ${key}`);
  }

  return {
    ...base,
    value: null,
    displayValue: "-",
    change: null,
    updatedAt: undefined,
    error: message
  } satisfies MetricCard;
}

function toSourceError(source: string, error: unknown): MacroSourceError {
  return {
    source,
    message: error instanceof Error ? error.message : "Unknown data source failure"
  };
}

async function loadMacroDependencies() {
  const [
    dgs2Result,
    dgs10Result,
    dgs30Result,
    vixResult,
    dxyResult,
    wtiResult,
    spFuturesResult,
    fearGreedResult,
    coinGeckoResult,
    btcFundingResult
  ] = await Promise.allSettled([
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

  const errors: MacroSourceError[] = [];

  if (dgs2Result.status === "rejected") errors.push(toSourceError("FRED:DGS2", dgs2Result.reason));
  if (dgs10Result.status === "rejected") errors.push(toSourceError("FRED:DGS10", dgs10Result.reason));
  if (dgs30Result.status === "rejected") errors.push(toSourceError("FRED:DGS30", dgs30Result.reason));
  if (vixResult.status === "rejected") errors.push(toSourceError("YAHOO:^VIX", vixResult.reason));
  if (dxyResult.status === "rejected") errors.push(toSourceError("YAHOO:DX-Y.NYB", dxyResult.reason));
  if (wtiResult.status === "rejected") errors.push(toSourceError("YAHOO:CL=F", wtiResult.reason));
  if (spFuturesResult.status === "rejected") {
    errors.push(toSourceError("YAHOO:ES=F", spFuturesResult.reason));
  }
  if (fearGreedResult.status === "rejected") {
    errors.push(toSourceError("CNN:FearGreed", fearGreedResult.reason));
  }
  if (coinGeckoResult.status === "rejected") {
    errors.push(toSourceError("COINGECKO", coinGeckoResult.reason));
  }
  if (btcFundingResult.status === "rejected") {
    errors.push(toSourceError("BINANCE:BTCUSDT", btcFundingResult.reason));
  }

  return {
    dgs2: dgs2Result.status === "fulfilled" ? dgs2Result.value : null,
    dgs10: dgs10Result.status === "fulfilled" ? dgs10Result.value : null,
    dgs30: dgs30Result.status === "fulfilled" ? dgs30Result.value : null,
    vix: vixResult.status === "fulfilled" ? vixResult.value : null,
    dxy: dxyResult.status === "fulfilled" ? dxyResult.value : null,
    wti: wtiResult.status === "fulfilled" ? wtiResult.value : null,
    spFutures: spFuturesResult.status === "fulfilled" ? spFuturesResult.value : null,
    fearGreed: fearGreedResult.status === "fulfilled" ? fearGreedResult.value : null,
    coinGecko: coinGeckoResult.status === "fulfilled" ? coinGeckoResult.value : null,
    btcFunding: btcFundingResult.status === "fulfilled" ? btcFundingResult.value : null,
    errors
  };
}

export async function getMacroCard(key: MacroCardKey): Promise<MetricCard> {
  try {
    switch (key) {
      case "dgs2": {
        const dgs2 = await getFredLatest("DGS2");
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: dgs2.value,
          displayValue: formatPercent(dgs2.value),
          updatedAt: dgs2.date,
          error: null
        };
      }
      case "dgs10": {
        const dgs10 = await getFredLatest("DGS10");
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: dgs10.value,
          displayValue: formatPercent(dgs10.value),
          updatedAt: dgs10.date,
          error: null
        };
      }
      case "dgs30": {
        const dgs30 = await getFredLatest("DGS30");
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: dgs30.value,
          displayValue: formatPercent(dgs30.value),
          updatedAt: dgs30.date,
          error: null
        };
      }
      case "spread_2s10s": {
        const [dgs2, dgs10] = await Promise.all([getFredLatest("DGS2"), getFredLatest("DGS10")]);
        const spreadBps = (dgs10.value - dgs2.value) * 100;
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: spreadBps,
          displayValue: `${spreadBps.toFixed(1)}bp`,
          updatedAt: new Date().toISOString(),
          error: null
        };
      }
      case "vix": {
        const vix = await getYahooQuote("^VIX");
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: vix.value,
          change: vix.change,
          displayValue: formatNumber(vix.value),
          updatedAt: new Date().toISOString(),
          error: null
        };
      }
      case "dxy": {
        const dxy = await getYahooQuote("DX-Y.NYB");
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: dxy.value,
          change: dxy.change,
          displayValue: formatNumber(dxy.value),
          updatedAt: new Date().toISOString(),
          error: null
        };
      }
      case "wti": {
        const wti = await getYahooQuote("CL=F");
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: wti.value,
          change: wti.change,
          displayValue: wti.value !== null ? `$${formatNumber(wti.value)}` : "-",
          updatedAt: new Date().toISOString(),
          error: null
        };
      }
      case "fear_greed": {
        const fearGreed = await getFearGreed();
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: fearGreed.value,
          displayValue: `${formatNumber(fearGreed.value, { maximumFractionDigits: 0 })}${fearGreed.rating ? ` · ${fearGreed.rating}` : ""}`,
          updatedAt: fearGreed.timestamp,
          error: null
        };
      }
      case "sp_futures": {
        const spFutures = await getYahooQuote("ES=F");
        return {
          ...EMPTY_MACRO_CARDS.find((card) => card.key === key)!,
          value: spFutures.value,
          change: spFutures.change,
          displayValue: formatNumber(spFutures.value),
          updatedAt: new Date().toISOString(),
          error: null
        };
      }
      default:
        return metricCardFallback(key, "지원하지 않는 지표입니다.");
    }
  } catch (error) {
    return metricCardFallback(
      key,
      error instanceof Error ? error.message : "지표를 불러오지 못했습니다."
    );
  }
}

export async function getMacroSnapshot() {
  const [cards, deps] = await Promise.all([
    Promise.all(EMPTY_MACRO_CARDS.map((card) => getMacroCard(card.key))),
    loadMacroDependencies()
  ]);

  const successfulCards = cards.filter((card) => card.value !== null || !card.error);
  if (successfulCards.length === 0 && deps.errors.length > 0) {
    throw new Error(`All macro sources failed: ${deps.errors[0]?.message ?? "Unknown error"}`);
  }

  const spread =
    typeof deps.dgs10?.value === "number" && typeof deps.dgs2?.value === "number"
      ? deps.dgs10.value - deps.dgs2.value
      : null;

  return {
    cards,
    raw: {
      rates: {
        dgs2: deps.dgs2,
        dgs10: deps.dgs10,
        dgs30: deps.dgs30,
        spread2s10s: spread
      },
      market: {
        vix: deps.vix,
        dxy: deps.dxy,
        wti: deps.wti,
        spFutures: deps.spFutures
      },
      sentiment: deps.fearGreed,
      crypto: { ...(deps.coinGecko ?? {}), btcFunding: deps.btcFunding },
      errors: deps.errors
    }
  };
}
