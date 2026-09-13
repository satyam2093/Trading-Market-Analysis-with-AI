/**
 * Live Financial News Service
 * Ingests and standardizes real-time financial market news from live global financial feeds.
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
  symbol?: string;
}

const POSITIVE_KEYWORDS = [
  "surge", "surges", "surging", "gain", "gains", "jump", "jumps", "rally", "rallies",
  "record", "high", "growth", "bullish", "profit", "beats", "beat", "positive",
  "expansion", "upbeat", "soar", "soars", "boost", "optimism", "recovery", "climbs"
];

const NEGATIVE_KEYWORDS = [
  "drop", "drops", "fall", "falls", "slump", "slumps", "plunge", "plunges", "loss",
  "losses", "crash", "crashes", "bearish", "inflation", "tariff", "tariffs", "recession",
  "warning", "downbeat", "downturn", "sink", "sinks", "dip", "dips", "fear", "crisis",
  "risk", "selloff", "tumble", "tumbles", "decline"
];

const HIGH_IMPACT_KEYWORDS = [
  "fed", "federal reserve", "interest rate", "rate cut", "rate hike", "central bank",
  "inflation", "cpi", "gdp", "earnings", "war", "tariff", "rbi", "sec", "sec guidance",
  "nifty", "sensex", "s&p", "nasdaq", "bitcoin", "crude", "oil", "opec", "jobs report"
];

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
      .slice(0, 240);

    const sentiment = analyzeSentiment(cleanTitle + " " + cleanDesc);
    const impact = analyzeImpact(cleanTitle);

    articles.push({
      id: "news_" + Math.abs(hashString(cleanTitle + pubDate)),
      title: cleanTitle,
      source: sourceName,
      url: link,
      published: formatRelativeTime(pubDate),
      published_at: pubDate,
      sentiment,
      impact,
      summary: cleanDesc || `${cleanTitle}. Market impact assessed at ${impact} level.`,
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

export async function fetchLiveMarketNews(limit = 20, symbol?: string): Promise<LiveNewsArticle[]> {
  const queryTopic = symbol
    ? encodeURIComponent(`${symbol} stock financial market`)
    : encodeURIComponent("stock market financial economy earnings sensex nifty");

  const urls = [
    `https://news.google.com/rss/search?q=${queryTopic}&hl=en-US&gl=US&ceid=US:en`,
    `https://news.google.com/rss/search?q=${encodeURIComponent("financial markets economy interest rates")}&hl=en-US&gl=US&ceid=US:en`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        next: { revalidate: 60 },
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
            const key = item.title.toLowerCase().slice(0, 50);
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
