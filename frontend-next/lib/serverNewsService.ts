/**
 * Live Financial News Service
 * Ingests real-time financial market news from live global feeds,
 * pairs articles with relevant editorial imagery, and evaluates sentiment.
 * Strictly zero fabricated or mock articles.
 */

export interface LiveNewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  published: string;
  published_at: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  impact: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  image_url: string;
  category?: string;
  symbol?: string;
}

const POSITIVE_KEYWORDS = [
  "surge", "surges", "surging", "gain", "gains", "jump", "jumps", "rally", "rallies",
  "record", "high", "growth", "bullish", "profit", "beats", "beat", "positive",
  "expansion", "upbeat", "soar", "soars", "boost", "optimism", "recovery", "climbs", "climb"
];

const NEGATIVE_KEYWORDS = [
  "drop", "drops", "fall", "falls", "slump", "slumps", "plunge", "plunges", "loss",
  "losses", "crash", "crashes", "bearish", "inflation", "tariff", "tariffs", "recession",
  "warning", "downbeat", "downturn", "sink", "sinks", "dip", "dips", "fear", "crisis",
  "risk", "selloff", "tumble", "tumbles", "decline", "tanks"
];

const HIGH_IMPACT_KEYWORDS = [
  "fed", "federal reserve", "interest rate", "rate cut", "rate hike", "central bank",
  "inflation", "cpi", "gdp", "earnings", "war", "tariff", "rbi", "sec", "sec guidance",
  "nifty", "sensex", "s&p", "nasdaq", "bitcoin", "crude", "oil", "opec", "jobs report"
];

const CURATED_FINANCIAL_IMAGES = {
  indian_markets: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=900&auto=format&fit=crop&q=80",
  central_banks: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=900&auto=format&fit=crop&q=80",
  ai_semiconductors: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=900&auto=format&fit=crop&q=80",
  crypto_digital: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80",
  energy_oil: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
  corporate_earnings: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&auto=format&fit=crop&q=80",
  trading_floor: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80",
  macro_economy: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=900&auto=format&fit=crop&q=80",
  banking_finance: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=900&auto=format&fit=crop&q=80",
};

function resolveTopicImage(title: string, desc: string): { imageUrl: string; category: string } {
  const text = (title + " " + desc).toLowerCase();

  if (text.includes("nifty") || text.includes("sensex") || text.includes("rbi") || text.includes("india") || text.includes("tcs") || text.includes("reliance")) {
    return { imageUrl: CURATED_FINANCIAL_IMAGES.indian_markets, category: "Indian Markets" };
  }
  if (text.includes("bitcoin") || text.includes("crypto") || text.includes("ethereum") || text.includes("btc") || text.includes("coinbase")) {
    return { imageUrl: CURATED_FINANCIAL_IMAGES.crypto_digital, category: "Crypto Assets" };
  }
  if (text.includes("nvidia") || text.includes("ai") || text.includes("chip") || text.includes("semiconductor") || text.includes("tech") || text.includes("apple") || text.includes("microsoft")) {
    return { imageUrl: CURATED_FINANCIAL_IMAGES.ai_semiconductors, category: "Tech & AI" };
  }
  if (text.includes("fed") || text.includes("rate") || text.includes("powell") || text.includes("central bank") || text.includes("treasury") || text.includes("dollar")) {
    return { imageUrl: CURATED_FINANCIAL_IMAGES.central_banks, category: "Central Banks" };
  }
  if (text.includes("oil") || text.includes("crude") || text.includes("gas") || text.includes("energy") || text.includes("opec")) {
    return { imageUrl: CURATED_FINANCIAL_IMAGES.energy_oil, category: "Commodities & Energy" };
  }
  if (text.includes("earnings") || text.includes("revenue") || text.includes("profit") || text.includes("quarterly") || text.includes("ipo")) {
    return { imageUrl: CURATED_FINANCIAL_IMAGES.corporate_earnings, category: "Corporate Earnings" };
  }
  if (text.includes("bank") || text.includes("credit") || text.includes("loan") || text.includes("liquidity")) {
    return { imageUrl: CURATED_FINANCIAL_IMAGES.banking_finance, category: "Banking & Credit" };
  }

  return { imageUrl: CURATED_FINANCIAL_IMAGES.trading_floor, category: "Global Macro" };
}

function analyzeSentiment(text: string): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
  const lower = text.toLowerCase();
  let posCount = 0;
  let negCount = 0;

  for (const w of POSITIVE_KEYWORDS) {
    if (lower.includes(w)) posCount++;
  }
  for (const w of NEGATIVE_KEYWORDS) {
    if (lower.includes(w)) negCount++;
  }

  if (posCount > negCount) return "POSITIVE";
  if (negCount > posCount) return "NEGATIVE";
  return "NEUTRAL";
}

function analyzeImpact(text: string): "HIGH" | "MEDIUM" | "LOW" {
  const lower = text.toLowerCase();
  for (const w of HIGH_IMPACT_KEYWORDS) {
    if (lower.includes(w)) return "HIGH";
  }
  return "MEDIUM";
}

function formatRelativeTime(dateStr: string): string {
  try {
    const pub = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - pub.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Just now";

    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 60) return `${Math.max(1, mins)}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    return pub.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}

function parseRssXml(xml: string, defaultSource = "Financial Wire"): LiveNewsArticle[] {
  const articles: LiveNewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];

    const titleMatch = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(itemContent);
    const linkMatch = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(itemContent);
    const pubDateMatch = /<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i.exec(itemContent);
    const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(itemContent);
    const descMatch = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(itemContent);
    const mediaMatch = /<media:content[^>]+url=["']([^"']+)["']/i.exec(itemContent);
    const enclosureMatch = /<enclosure[^>]+url=["']([^"']+)["']/i.exec(itemContent);

    let rawTitle = titleMatch ? titleMatch[1].trim() : "";
    if (!rawTitle) continue;

    // Clean Google News source trailer (e.g. "Headline - Reuters" -> "Headline", source = "Reuters")
    let sourceName = defaultSource;
    if (sourceMatch && sourceMatch[1]) {
      sourceName = sourceMatch[1].trim();
    } else if (rawTitle.includes(" - ")) {
      const parts = rawTitle.split(" - ");
      if (parts.length > 1) {
        sourceName = parts.pop()!.trim();
        rawTitle = parts.join(" - ").trim();
      }
    }

    // Clean HTML entities
    const cleanTitle = rawTitle
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

    const link = linkMatch ? linkMatch[1].trim() : "#";
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();

    // Clean summary description
    let cleanDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, " ").trim() : "";
    cleanDesc = cleanDesc
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .slice(0, 260);

    const sentiment = analyzeSentiment(cleanTitle + " " + cleanDesc);
    const impact = analyzeImpact(cleanTitle);
    const { imageUrl: topicImg, category } = resolveTopicImage(cleanTitle, cleanDesc);
    const finalImage = mediaMatch?.[1] || enclosureMatch?.[1] || topicImg;

    articles.push({
      id: "news_" + Math.abs(hashString(cleanTitle + pubDate)),
      title: cleanTitle,
      source: sourceName,
      url: link,
      published: formatRelativeTime(pubDate),
      published_at: pubDate,
      sentiment,
      impact,
      summary: cleanDesc || `${cleanTitle}. Market impact assessed at ${impact} priority.`,
      image_url: finalImage,
      category,
    });
  }

  return articles;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export async function fetchLiveMarketNews(limit = 25, symbol?: string): Promise<LiveNewsArticle[]> {
  const queryTopic = symbol
    ? encodeURIComponent(`${symbol} stock financial market`)
    : encodeURIComponent("stock market financial economy earnings sensex nifty fed");

  const urls = [
    `https://news.google.com/rss/search?q=${queryTopic}&hl=en-US&gl=US&ceid=US:en`,
    `https://news.google.com/rss/search?q=${encodeURIComponent("financial markets economy interest rates inflation")}&hl=en-US&gl=US&ceid=US:en`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        next: { revalidate: 45 },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const xml = await res.text();
        const parsed = parseRssXml(xml);
        if (parsed.length > 0) {
          // Deduplicate by title
          const seen = new Set<string>();
          const deduped: LiveNewsArticle[] = [];
          for (const item of parsed) {
            const key = item.title.toLowerCase().slice(0, 45);
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(item);
            }
          }
          return deduped.slice(0, limit);
        }
      }
    } catch (err) {
      console.warn("Live news fetch from feed error:", err instanceof Error ? err.message : err);
    }
  }

  return [];
}
