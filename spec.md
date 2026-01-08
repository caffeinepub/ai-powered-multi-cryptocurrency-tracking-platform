# Cryptocurrency Tracking Platform

## Overview
A cryptocurrency tracking platform that provides real-time price monitoring for ICP and displays market data for the top 50 cryptocurrencies.

## Core Features

### ICP Live Price Tracker
- Display a dynamic chart showing real-time ICP price changes with continuous updates
- Implement robust chart data system with fallback mechanisms:
  - Cache recent price history data in backend
  - When API endpoints fail, display cached data or recent averages
  - Ensure chart always shows meaningful price history instead of "Chart data temporarily unavailable"
- Implement enhanced price alert system:
  - View all currently active alerts with their status (triggered, pending, inactive)
  - Add new alerts by entering custom target prices
  - Remove existing alerts
  - Visual indicators for different alert states
  - Automatic UI updates when alerts are added or removed
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
- Interactive price charts for ICP visualization with fallback data display
- Sortable table for top 50 cryptocurrencies
- Real-time data updates without page refresh
- Enhanced price alert management interface:
  - Form to add new price alerts
  - List view of all active alerts with status indicators
  - Delete functionality for existing alerts
  - Visual states for triggered, pending, and inactive alerts
- React Query integration for automatic UI revalidation when alerts change
- Enhanced error handling with user-friendly messages:
  - Display retry button when network errors occur
  - Show "Data temporarily unavailable" message instead of generic connection errors
  - Provide clear feedback when API calls fail
- Call backend endpoints instead of external APIs directly

### Backend
- Store user's ICP investment data (1864 coins, $6.152 average cost)
- Store and manage price alerts:
  - Create new price alerts with custom target prices
  - Delete existing price alerts
  - Track alert status (triggered, pending, inactive)
  - Provide endpoints for alert CRUD operations
- Implement price data caching and fallback system:
  - Cache recent ICP price history data
  - Provide fallback data when external APIs fail
  - Maintain recent price averages for chart display
- Fetch live ICP price data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd`)
- Fetch top 50 cryptocurrencies data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`)
- Decode JSON responses from external APIs and expose clean Motoko endpoints
- Provide endpoints for:
  - Current ICP price and historical data with fallback support
  - Top 50 cryptocurrencies market data
  - Investment portfolio calculations
  - Complete price alert management (create, read, update, delete)

### Data Management
- Backend stores investment portfolio information
- Backend stores price alert configurations with status tracking
- Backend caches recent price data for fallback scenarios
- Backend fetches real-time price data from CoinGecko API via HTTP outcalls
- Historical price data for chart visualization with cached fallbacks
- Clean data transformation from external API responses to frontend-consumable format

## User Interface
- Two main sections: ICP tracker and top 50 dashboard
- Navigation between different views
- Responsive charts and tables with reliable data display
- Enhanced price alert management section with intuitive controls
- Clean typography and modern styling
- Color coding for price changes (green for gains, red for losses)
- Visual indicators for alert states (different colors/icons for triggered, pending, inactive)
- Improved error states with actionable user feedback
- Application content displayed in English
