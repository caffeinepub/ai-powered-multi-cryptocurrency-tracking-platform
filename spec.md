# Specification

## Summary
**Goal:** Rebuild the frontend as a clean, dark-mode crypto tracker showing the top 100 cryptocurrencies by market cap, with filtering/sorting controls, a 12-month price projection section, and a cohesive neon-accented dark UI.

**Planned changes:**
- Replace all existing dashboard components with a single `Top100Dashboard` component that fetches the top 100 coins from the CoinGecko public API and displays them in a paginated (25/page), sortable table with columns: Rank, Name/Symbol (with logo), Price, 24h Change (%), Market Cap, 24h Volume, Buy Ratio, and Fully Diluted Market Cap
- Add a filter/sort control bar above the table with a text search input, four metric dropdowns (Market Cap, 24h Volume, Buy Ratio, Fully Diluted Market Cap — each with High→Low / Low→High), and a Reset button
- Add a Price Projections section below the table with a searchable coin selector, a 12-month projection table (low/mid/high prices + confidence score per month), and a Recharts line chart of the mid-price trajectory; projections computed client-side using linear regression and volatility logic on 30-day CoinGecko history
- Implement a React Query data-fetching layer (`useTopCoins` with 60s stale time, `useCoinHistory` with 5-minute stale time), both with exponential backoff retry (max 3) and cached fallback on error
- Apply a dark-mode-first theme: near-black charcoal background, neon cyan primary accent, gold secondary accent, glassmorphism table/card/dropdown styling, emerald green for positive and red for negative 24h changes, sticky header with "Crypto Tracker AI" branding and a pulsing live badge, responsive down to 375px
- Remove/clean up all legacy components (Top150Dashboard, MultiCryptoDashboard, ICPDashboard, etc.)
- Update `App.tsx` to render only the new `Top100Dashboard`

**User-visible outcome:** Users see a fully rebuilt crypto tracker with a live top-100 table, real-time filtering and sorting controls, and a dedicated section to view 12-month price projections with a chart for any of the listed coins — all in a polished dark UI.
