import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background py-16 text-sm text-muted-foreground">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
              NEXQUANT
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Next-generation quantitative intelligence platform. Real-time market streaming, multi-horizon AI models, technical structure analysis, and automated risk governance.
            </p>
            <div className="pt-2 text-xs font-mono text-muted-foreground/80">
              <span>See the Market. Understand the Signal.</span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-foreground transition-colors">Markets Overview</Link></li>
              <li><Link href="/discover" className="hover:text-foreground transition-colors">Discover & Screen</Link></li>
              <li><Link href="/watchlist" className="hover:text-foreground transition-colors">Watchlist</Link></li>
              <li><Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio Analytics</Link></li>
              <li><Link href="/backtest" className="hover:text-foreground transition-colors">Strategy Backtest</Link></li>
            </ul>
          </div>

          {/* Intelligence Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Intelligence</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/assets/BTC" className="hover:text-foreground transition-colors">Bitcoin (BTC)</Link></li>
              <li><Link href="/assets/NVDA" className="hover:text-foreground transition-colors">NVIDIA (NVDA)</Link></li>
              <li><Link href="/assets/RELIANCE.NS" className="hover:text-foreground transition-colors">Reliance (RELIANCE.NS)</Link></li>
              <li><Link href="/assets/SPY" className="hover:text-foreground transition-colors">S&P 500 (SPY)</Link></li>
              <li><Link href="/news" className="hover:text-foreground transition-colors">News Sentiment</Link></li>
            </ul>
          </div>
        </div>

        {/* Regulatory & Disclaimer Bottom */}
        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-muted-foreground/70">
          <p>© {new Date().getFullYear()} NexQuant Technologies Inc. All rights reserved.</p>
          <p className="max-w-xl text-left md:text-right leading-relaxed">
            Quantitative predictions, consensus signals, and algorithmic metrics are probabilistic statistical models provided strictly for intelligence and research purposes. Not financial or investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
