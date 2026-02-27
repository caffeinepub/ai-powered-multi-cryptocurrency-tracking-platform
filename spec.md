# Specification

## Summary
**Goal:** Replace the existing crypto dashboard with a full-featured Crypto Tracker AI app showing live data for the top 150 cryptocurrencies, advanced filters, and a 12-month price projection tool.

**Planned changes:**
- Build a full-page dark-mode dashboard with a "Crypto Tracker AI" header and a hero banner
- Fetch live top-150 coin data from CoinGecko (market cap, price, 24h change, volume, buy ratio, fully diluted market cap) with auto-refresh every 60 seconds
- Display coins in a sortable, paginated table with color-coded 24h change (green/red) and coin logos
- Add a filter/control bar with four dropdowns (Market Cap, Volume, Buy Ratio, Fully Diluted Market Cap), a search input by name/symbol, and a reset button
- Add a "Price Projections" section below the table with a searchable coin selector, a 12-row monthly projection table (low/mid/high price + confidence %), and a Recharts line chart with shaded bands
- Implement client-side projection logic using current price and 30-day historical trend from CoinGecko (no external AI API)
- Add `useTopCoins` and `useCoinHistory` React Query hooks with caching, loading skeletons, and error handling
- Apply a dark charcoal/neon cyan/gold glassmorphism theme, fully responsive down to 375 px

**User-visible outcome:** Users can browse, sort, and filter the top 150 cryptocurrencies live, then select any coin to view a 12-month algorithmic price projection with a chart and monthly targets.
