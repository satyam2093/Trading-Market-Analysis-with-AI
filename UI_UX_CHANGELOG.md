# UI/UX Changelog — NexQuant Platform Redesign

## Version 2.0 — Complete Redesign (September 2026)

### Theme System
- **REMOVED**: Day/Night toggle and ThemeContext.tsx
- **IMPLEMENTED**: Single professional dark theme across all pages
- **Color Palette**: Deep navy (#0a0e1a) background, cyan (#00d4ff) accents, emerald (#00ff88) for bullish, red (#ff4444) for bearish
- **Typography**: System font stack with monospace for numerical data

---

### Homepage (page.tsx)

#### Section 1: Animated Ticker Tape
- Auto-scrolling horizontal tape showing live index prices
- Color-coded green/red for positive/negative change
- Smooth CSS animation with infinite loop

#### Section 2: Global Market Centers Grid
- 4-column grid showing major market centers (US, India, Europe, Asia)
- Each card shows index name, current price, % change, and status (Open/Closed)
- Real-time data from Yahoo Finance API via server-side fetching

#### Section 3: Live News Wire
- Real financial news from GNews API with editorial images
- Sentiment badges (Bullish/Bearish/Neutral) on each article
- Auto-refresh every 5 minutes
- Fallback placeholder images when no image available
- Links open in new tab with proper security attributes

#### Section 4: AI Architecture Showcase
- Visual representation of the 8-model AI pipeline
- Interactive cards for each model with description

#### Section 5: News Impact Model Panel (NEW)
- Visual decay curves showing news impact half-life per trading style
- Bar chart comparing SCALPER (2h) → INVESTOR (168h) half-lives
- Educational tooltip explaining exponential decay weighting

#### Section 6: Trading Style Selector (NEW)
- 4-card interactive selector: SCALPER, INTRADAY, SWING, INVESTOR
- Each card shows: icon, name, default timeframe, description
- Deep-dive panel with model weights, risk parameters, and horizon details
- Selection persisted to localStorage via TradingStyleContext

#### Section 7: Top Assets & Horizon Consensus Signals
- Grid of tracked assets with live ensemble signal
- Signal adapts to selected trading style
- Confidence meter and risk level badge per asset

---

### Asset Terminal Page (assets/[symbol]/page.tsx)

#### Header Banner
- Full-width gradient banner with asset name, price, and 24h change
- Compact TradingStyleSelector bar below header showing current style and horizon

#### Trading Style Integration
- Ensemble signal request includes trading_style parameter
- All model outputs reflect the selected style's parameters
- Style can be changed per-asset without affecting global selection

---

### Navbar
- Removed theme toggle button
- Consistent dark theme styling
- Clean navigation with Home, Assets, and auth controls

---

### Component Library (NEW)

| Component | Location | Purpose |
|-----------|----------|---------|
| TradingStyleSelector | components/trading/ | 4-card style picker with compact mode |
| NewsImpactPanel | components/news/ | News decay visualization |
| TradingStyleContext | context/ | Global style state with localStorage |

---

### Accessibility
- All interactive elements have proper hover/focus states
- Color contrast ratios meet WCAG AA standards for dark theme
- Keyboard navigation supported for style selector cards
- Screen reader labels on icon-only buttons

### Performance
- Images use next/image with lazy loading
- CSS animations use transform/opacity for GPU acceleration
- Trading style config loaded synchronously (no API call needed)
