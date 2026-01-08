# Cryptocurrency Tracking Platform

## Overview
A cryptocurrency tracking platform that provides real-time price monitoring for ICP and displays market data for the top 50 cryptocurrencies.

## Core Features

### ICP Live Price Tracker
- Display a robust dynamic chart showing real-time ICP price changes with continuous updates and reliable data display
- Implement comprehensive chart timeframe selection with the following options:
  - Short-term intervals: 1-minute, 2-minute, 3-minute, 5-minute, 10-minute, 15-minute, 30-minute
  - Medium-term intervals: 1-hour, 2-hour, 4-hour, 6-hour
  - Long-term intervals: 1-day, 1-month, 1-quarter, 1-year
- Implement enhanced chart data system with precise time-based intervals and fallback mechanisms:
  - Cache comprehensive price history data in backend with proper time-based indexing
  - Automatically refresh and resample data based on selected timeframe
  - Seamless transitions between different timeframes
  - When API endpoints fail, display cached data maintaining chart consistency
  - Ensure chart always shows meaningful price history with proper time intervals
- Implement comprehensive price alert system with full manual management:
  - View all currently active alerts with their status (triggered, pending, inactive)
  - Add new alerts by entering custom target prices
  - Remove existing alerts with immediate UI updates
  - Visual indicators for different alert states
  - Synchronize alert actions with backend through React Query mutation hooks
  - Instant UI updates when alerts are added, removed, or status changes
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
- Interactive price charts for ICP visualization with comprehensive timeframe selection
- Automatic chart refresh and data resampling based on selected timeframe
- Seamless transitions between different chart timeframes
- Enhanced fallback data display with proper time-based intervals
- Sortable table for top 50 cryptocurrencies
- Real-time data updates without page refresh
- Comprehensive price alert management interface:
  - Form to add new price alerts with validation
  - Complete list view of all active alerts with status indicators
  - Delete functionality for existing alerts with confirmation
  - Visual states for triggered, pending, and inactive alerts
  - Manual alert management with full CRUD operations
- React Query integration with mutation hooks for alert management:
  - Instant UI updates when alerts are modified
  - Automatic revalidation of alert data
  - Synchronization with backend `toggleAlertStatus` and `getAlerts` functions
- Enhanced error handling with user-friendly messages:
  - Display retry button when network errors occur
  - Show "Data temporarily unavailable" message instead of generic connection errors
  - Provide clear feedback when API calls fail
- Call backend endpoints instead of external APIs directly

### Backend
- Store user's ICP investment data (1864 coins, $6.152 average cost)
- Store and manage price alerts with enhanced functionality:
  - Create new price alerts with custom target prices
  - Delete existing price alerts
  - Toggle alert status (triggered, pending, inactive)
  - Provide comprehensive endpoints for alert CRUD operations
  - Implement `toggleAlertStatus` and `getAlerts` functions for frontend integration
- Implement robust price data caching and fallback system:
  - Cache comprehensive ICP price history data with precise time-based indexing
  - Maintain `icpPriceHistory` with proper time intervals for all supported timeframes
  - Provide reliable fallback data when external APIs fail
  - Ensure chart consistency by maintaining recent price entries
  - Support data resampling for different timeframe requirements
- Fetch live ICP price data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd`)
- Fetch top 50 cryptocurrencies data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`)
- Decode JSON responses from external APIs and expose clean Motoko endpoints
- Provide endpoints for:
  - Current ICP price and comprehensive historical data with time-based intervals
  - Chart data for all supported timeframes with fallback support
  - Top 50 cryptocurrencies market data
  - Investment portfolio calculations
  - Complete price alert management with status synchronization

### Data Management
- Backend stores investment portfolio information
- Backend stores price alert configurations with comprehensive status tracking
- Backend caches extensive price data with time-based indexing for reliable chart display
- Backend fetches real-time price data from CoinGecko API via HTTP outcalls
- Comprehensive historical price data for all chart timeframes with cached fallbacks
- Clean data transformation from external API responses to frontend-consumable format
- Proper maintenance of `icpPriceHistory` for chart consistency

## User Interface
- Two main sections: ICP tracker and top 50 dashboard
- Navigation between different views
- Responsive charts with comprehensive timeframe selection and reliable data display
- Enhanced price alert management section with full manual control and intuitive interface
- Clean typography and modern styling
- Color coding for price changes (green for gains, red for losses)
- Visual indicators for alert states (different colors/icons for triggered, pending, inactive)
- Improved error states with actionable user feedback
- Seamless chart transitions between timeframes
- Application content displayed in English
