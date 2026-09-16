import { NextRequest } from "next/server";

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
  category: string;
  symbol?: string;
}

// 24 distinct, high-resolution editorial financial photos to ensure NO duplicates
const CURATED_IMAGE_POOL: string[] = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80", // Trading floor screens
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=900&auto=format&fit=crop&q=80", // Stock charts green
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=900&auto=format&fit=crop&q=80", // Bank / Currency
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=900&auto=format&fit=crop&q=80", // Cyber tech / AI chips
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80", // Circuit board
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80", // Industrial energy
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&auto=format&fit=crop&q=80", // Data analytics
  "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=900&auto=format&fit=crop&q=80", // Financial growth coins
  "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=900&auto=format&fit=crop&q=80", // Architectural bank pillar
  "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=900&auto=format&fit=crop&q=80", // Bull sculpture Wall St
  "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=900&auto=format&fit=crop&q=80", // Financial district skyscraper
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=900&auto=format&fit=crop&q=80", // Modern office meeting
  "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=900&auto=format&fit=crop&q=80", // Digital crypto tokens
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80", // Executive business suit
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&auto=format&fit=crop&q=80", // Modern finance mobile app
  "https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=900&auto=format&fit=crop&q=80", // Modern workspace laptop
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&auto=format&fit=crop&q=80", // Dubai skyline / Global wealth
  "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=900&auto=format&fit=crop&q=80", // Server room cloud data
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&auto=format&fit=crop&q=80", // Professional presentation
  "https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=900&auto=format&fit=crop&q=80", // Global cargo port logistics
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80", // High rise corporate glass
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80", // Calculation & accounting
  "https://images.unsplash.com/photo-1569025743873-ea3a9ada89f9?w=900&auto=format&fit=crop&q=80", // Semiconductor fabrication
  "https://images.unsplash.com/photo-1520607164069-c5b525ffb4a5?w=900&auto=format&fit=crop&q=80"  // Global trade conference
];

function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, "—")
    .replace(/&#8211;/g, "–")
    .replace(/&hellip;/g, "...");
}

function stripHtml(html: string): string {
  if (!html) return "";
  let clean = decodeHtmlEntities(html);
  // strip all HTML tags
  clean = clean.replace(/<[^>]*>/g, " ");
  // strip any remaining encoded tag fragments
  clean = clean.replace(/&lt;[^&]*&gt;/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
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

function resolveCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("nifty") || lower.includes("sensex") || lower.includes("rbi") || lower.includes("india") || lower.includes("tcs") || lower.includes("reliance")) {
    return "Indian Markets";
  }
  if (lower.includes("bitcoin") || lower.includes("crypto") || lower.includes("ethereum") || lower.includes("btc") || lower.includes("coinbase")) {
    return "Crypto & Digital Assets";
  }
  if (lower.includes("nvidia") || lower.includes("ai") || lower.includes("chip") || lower.includes("semiconductor") || lower.includes("tech") || lower.includes("apple") || lower.includes("microsoft")) {
    return "Tech & AI";
  }
  if (lower.includes("fed") || lower.includes("rate") || lower.includes("powell") || lower.includes("central bank") || lower.includes("treasury") || lower.includes("dollar")) {
    return "Central Banks & Macro";
  }
  if (lower.includes("oil") || lower.includes("crude") || lower.includes("gas") || lower.includes("energy") || lower.includes("opec")) {
    return "Commodities & Energy";
  }
  if (lower.includes("earnings") || lower.includes("revenue") || lower.includes("profit") || lower.includes("quarterly") || lower.includes("guidance")) {
    return "Corporate Earnings";
  }
  return "Global Macro";
}

function formatRelativeTime(dateStr: string): string {
  try {
    const pub = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - pub.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Just now";

    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 60) return Math.max(1, mins) + "m ago";

    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + "h ago";

    const days = Math.floor(hours / 24);
    if (days < 30) return days + "d ago";

    return pub.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateContextualSummary(title: string, category: string, sentiment: string, impact: string): string {
  if (category === "Indian Markets") {
    return "Major development affecting benchmark indices and sector movements across NSE and BSE equities. Market participants monitor institutional flow, liquidity, and trading range momentum.";
  }
  if (category === "Central Banks & Macro") {
    return "Monetary policy developments, yield curve shifts, and rate expectations setting broader valuation multiples across equity and fixed income benchmarks.";
  }
  if (category === "Tech & AI") {
    return "High-growth technology developments driving semiconductor demand, enterprise cloud infrastructure, and market-cap weighted index momentum.";
  }
  if (category === "Crypto & Digital Assets") {
    return "Digital asset liquidity and on-chain positioning signaling volatility shifts across institutional crypto trading desks.";
  }
  if (category === "Commodities & Energy") {
    return "Geopolitical developments and physical supply-demand dynamics influencing commodity spot prices and energy sector valuations.";
  }
  if (category === "Corporate Earnings") {
    return "Quarterly corporate financial disclosures and balance sheet metrics impacting earnings multiples and analyst forward forecasts.";
  }
  return "Real-time macroeconomic reporting with " + impact.toLowerCase() + " market impact priority, monitored by quantitative trading desks for price action confirmation.";
}

function cleanDescriptionText(rawDesc: string, title: string, category: string, sentiment: string, impact: string): string {
  if (!rawDesc) return generateContextualSummary(title, category, sentiment, impact);

  let clean = stripHtml(rawDesc);

  // If text contains URLs, links, or RSS artifacts, discard it
  if (
    clean.includes("http://") ||
    clean.includes("https://") ||
    clean.includes("news.google.com") ||
    clean.includes("href=") ||
    clean.includes("&lt;") ||
    clean.includes("&gt;") ||
    clean.startsWith("a href") ||
    clean.length < 25 ||
    clean.toLowerCase() === title.toLowerCase()
  ) {
    return generateContextualSummary(title, category, sentiment, impact);
  }

  // Trim to 220 characters at word boundary
  if (clean.length > 220) {
    const trimmed = clean.slice(0, 215);
    const lastSpace = trimmed.lastIndexOf(" ");
    return (lastSpace > 100 ? trimmed.slice(0, lastSpace) : trimmed) + "...";
  }

  return clean;
}

function parseFeedXml(xml: string, defaultSource: string): LiveNewsArticle[] {
  const articles: LiveNewsArticle[] = [];
  const itemRegex = /<item[\s\S]*?>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];

    const titleMatch = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(itemContent);
    const linkMatch = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(itemContent);
    const pubDateMatch = /<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i.exec(itemContent);
    const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(itemContent);
    const descMatch = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(itemContent);
    
    // Media matching
    const mediaContentMatch = /<media:content[^>]+url=["']([^"']+)["']/i.exec(itemContent);
    const enclosureMatch = /<enclosure[^>]+url=["']([^"']+)["']/i.exec(itemContent);
    const descImgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(descMatch ? descMatch[1] : "");

    let rawTitle = titleMatch ? titleMatch[1].trim() : "";
    if (!rawTitle) continue;

    let sourceName = defaultSource;
    if (sourceMatch && sourceMatch[1]) {
      sourceName = stripHtml(sourceMatch[1]);
    } else if (rawTitle.includes(" - ")) {
      const parts = rawTitle.split(" - ");
      if (parts.length > 1) {
        sourceName = parts.pop()!.trim();
        rawTitle = parts.join(" - ").trim();
      }
    }

    const cleanTitle = stripHtml(rawTitle);
    if (!cleanTitle || cleanTitle.length < 10) continue;

    const link = linkMatch ? stripHtml(linkMatch[1]) : "#";
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();

    const category = resolveCategory(cleanTitle);
    const sentiment = analyzeSentiment(cleanTitle);
    const impact = analyzeImpact(cleanTitle);

    const summary = cleanDescriptionText(descMatch ? descMatch[1] : "", cleanTitle, category, sentiment, impact);

    // Image resolution
    let articleImage = mediaContentMatch?.[1] || enclosureMatch?.[1] || descImgMatch?.[1];

    if (!articleImage || articleImage.includes("feedburner") || articleImage.includes("blank.gif")) {
      const poolIdx = hashString(cleanTitle + pubDate) % CURATED_IMAGE_POOL.length;
      articleImage = CURATED_IMAGE_POOL[poolIdx];
    }

    articles.push({
      id: "news_" + hashString(cleanTitle + link),
      title: cleanTitle,
      source: sourceName,
      url: link,
      published: formatRelativeTime(pubDate),
      published_at: pubDate,
      sentiment,
      impact,
      summary,
      image_url: articleImage,
      category,
    });
  }

  return articles;
}

export async function fetchLiveMarketNews(limit = 25, query?: string): Promise<LiveNewsArticle[]> {
  const isIndia = query ? /nifty|sensex|india|tcs|reliance/i.test(query) : false;

  const feeds: { url: string; source: string }[] = [];

  if (isIndia) {
    feeds.push(
      { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "The Economic Times" },
      { url: "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms", source: "ET Markets" }
    );
  } else {
    feeds.push(
      { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "The Economic Times" },
      { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", source: "MarketWatch" },
      { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance" },
      { url: "https://www.investing.com/rss/news.rss", source: "Investing.com" }
    );
  }

  const allArticles: LiveNewsArticle[] = [];
  const seenTitles = new Set<string>();

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        next: { revalidate: 30 },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const xml = await res.text();
        const parsed = parseFeedXml(xml, feed.source);
        for (const item of parsed) {
          const key = item.title.toLowerCase().slice(0, 40);
          if (!seenTitles.has(key)) {
            seenTitles.add(key);
            allArticles.push(item);
          }
        }
      }
    } catch (e) {
      // Continue to next feed
    }

    if (allArticles.length >= limit * 1.5) break;
  }

  // Ensure unique images
  const usedImages = new Set<string>();
  const finalizedArticles: LiveNewsArticle[] = [];

  for (let i = 0; i < allArticles.length; i++) {
    const art = allArticles[i];
    let finalImg = art.image_url;

    if (usedImages.has(finalImg)) {
      const poolIdx = (hashString(art.title) + i) % CURATED_IMAGE_POOL.length;
      finalImg = CURATED_IMAGE_POOL[poolIdx];
    }

    usedImages.add(finalImg);
    finalizedArticles.push({
      ...art,
      image_url: finalImg,
    });

    if (finalizedArticles.length >= limit) break;
  }

  return finalizedArticles;
}
