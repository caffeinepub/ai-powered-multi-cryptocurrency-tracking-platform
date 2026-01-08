# Cryptocurrency Tracking Platform

## Overview
A cryptocurrency tracking platform that provides real-time price monitoring for ICP and displays market data for the top 50 cryptocurrencies.

## Core Features

### ICP Live Price Tracker
- Display a dynamic chart showing real-time ICP price changes with continuous updates
- Implement robust chart data retrieval with fallback mechanisms:
  - Primary data source: CoinGecko 7-day historical price API
  - Fallback to cached or last-known prices when API fails
  - Prevent "Chart data temporarily unavailable" messages through data persistence
- Implement configurable price alert system where users can:
  - View all currently configured alert price points with their active/inactive status
  - Add new price alerts through input field and confirmation button
  - Remove existing alerts with delete or toggle options
  - See real-time updates as alert configurations change
- Show investment portfolio summary:
  - Total coins: 1864 ICP
  - Average cost: $6.152
  - Current total value (calculated in real-time based on live price)
  - Current profit/loss percentage and amount

### Top 50 Cryptocurrencies Dashboard
- Display live data for the top 50 cryptocurrencies by market capitalization
- Show for each cryptocurrency:
  - Current price in USD
  - 24-hour percentage change
  - Market capitalization
  - Cryptocurrency name and symbol
- Automatically refresh data at regular intervals to maintain accuracy

## Technical Requirements

### Frontend
- Clean, modern React user interface
- Responsive design that works on desktop and mobile devices
- Interactive price charts for ICP visualization with reliable data display
- Enhanced price alerts management interface:
  - Display current alerts with status indicators
  - Input field and button for adding new alerts
  - Delete/toggle buttons for removing alerts
  - Real-time synchronization with backend alert changes
- Update frontend hooks (useQueries.ts) to fetch and update full alert list after each add/remove operation
- Sortable table for top 50 cryptocurrencies
- Real-time data updates without page refresh
- Price alert notifications when targets are reached
- Enhanced error handling with user-friendly messages:
  - Display retry button when network errors occur
  - Show "Data temporarily unavailable" message instead of generic connection errors
  - Provide clear feedback when API calls fail
- Call backend endpoints instead of external APIs directly

### Backend
- Store user's ICP investment data (1864 coins, $6.152 average cost)
- Store and manage configurable price alert targets:
  - Persist user-defined alert price points
  - Track active/inactive status for each alert
  - Handle alert additions, deletions, and status toggles
  - Provide endpoints for full alert list retrieval
- Implement robust price data fetching with caching:
  - Fetch live ICP price data from CoinGecko API
  - Cache historical chart data for fallback scenarios
  - Store last-known prices to prevent chart data unavailability
- Fetch top 50 cryptocurrencies data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`)
- Decode JSON responses from external APIs and expose clean Motoko endpoints
- Provide endpoints for:
  - Current ICP price and historical data with fallback support
  - Top 50 cryptocurrencies market data
  - Investment portfolio calculations
  - Configurable price alert management (add, remove, toggle, list)

### Data Management
- Backend stores investment portfolio information
- Backend stores user-configurable price alert configurations with persistence
- Backend maintains cached price data for chart reliability
- Backend fetches real-time price data from CoinGecko API via HTTP outcalls
- Historical price data for chart visualization with fallback mechanisms
- Clean data transformation from external API responses to frontend-consumable format

## User Interface
- Two main sections: ICP tracker and top 50 dashboard
- Enhanced price alerts management section with interactive controls
- Navigation between different views
- Responsive charts and tables with reliable data display
- Clean typography and modern styling
- Color coding for price changes (green for gains, red for losses)
- Improved error states with actionable user feedback
- Application content displayed in English
