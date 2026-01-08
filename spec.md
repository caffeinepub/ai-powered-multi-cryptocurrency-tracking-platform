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
- Implement enhanced chart data system with precise time-based intervals and accurate resampling:
  - Cache comprehensive price history data in backend with proper time-based indexing for all timeframes
  - Automatically refresh and resample data based on selected timeframe with precise historical resolution matching
  - Ensure data refresh logic dynamically matches the selected interval with accurate nanosecond conversions for each timeframe
  - Backend resampling intervals must be precisely synchronized with frontend timeframe selections using proper nanosecond time calculations
  - Seamless transitions between different timeframes with consistent updates and improved data consistency
  - When API endpoints fail, display cached data maintaining chart consistency
  - Ensure chart always shows meaningful price history with proper time intervals for all 15 timeframe options
  - Optimize high-frequency data caching for short intervals while maintaining performance
  - Synchronize chart data refresh and timeframe switching with backend caching for reliable rendering
  - Align backend caching and resampling mechanism to handle varying data densities across all timeframes
- Implement interactive chart hover tooltips:
  - Display comprehensive details including precise date/time, price, and any active indicator values
  - Show formatted price values and readable time stamps
  - Include technical indicator values when indicators are enabled
  - Improve chart readability and user interaction
- Implement technical indicator system with interactive controls:
  - Optional RSI (Relative Strength Index) indicator with toggle on/off functionality
  - Optional MACD (Moving Average Convergence Divergence) indicator with toggle on/off functionality
  - Optional TTM Squeeze indicator with toggle on/off functionality
  - Each indicator calculates and renders correctly based on the selected timeframe with enhanced handling of varying data densities
  - Interactive controls to enable/disable each indicator independently
  - Proper indicator scaling and visualization on the chart with smooth transitions between timeframes
  - Refined indicator calculations to maintain valid results when switching between short and long intervals
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
- Implement column filtering functionality:
  - Filter by Name with text input
  - Filter by Symbol with text input
  - Filter by Price with range or comparison inputs
  - Filter by 24h Change with range or comparison inputs
  - Filter by Market Cap with range or comparison inputs
  - User-friendly filter inputs positioned above or within column headers
- Automatically refresh data at regular intervals to maintain accuracy

## Technical Requirements

### Frontend
- Clean, modern React user interface
- Responsive design that works on desktop and mobile devices
- Interactive price charts for ICP visualization with comprehensive timeframe selection
- Enhanced charting logic to dynamically load and update historical price data for each timeframe with improved responsiveness
- Precise automatic chart refresh and data resampling matching selected timeframe intervals
- Seamless transitions between different chart timeframes with consistent data updates and reduced load times
- Enhanced fallback data display with proper time-based intervals
- Interactive hover tooltips on charts showing comprehensive data including date/time, price, and indicator values
- Technical indicator controls with toggle functionality for RSI, MACD, and TTM Squeeze
- Proper indicator calculation and rendering based on selected timeframe with refined handling of varying data densities
- Robust synchronization layer using enhanced useQueries hook to prefetch and cache data for multiple timeframes
- Sortable and filterable table for top 50 cryptocurrencies with column-specific filters
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
- Enhanced error handling with graceful recovery:
  - Display retry button when network errors occur
  - Show "Data temporarily unavailable" message instead of generic connection errors
  - Provide clear feedback when API calls fail
  - Graceful recovery from temporary API or connection issues on both chart and table components
- Call backend endpoints instead of external APIs directly

### Backend
- Store user's ICP investment data (1864 coins, $6.152 average cost)
- Store and manage price alerts with enhanced functionality:
  - Create new price alerts with custom target prices
  - Delete existing price alerts
  - Toggle alert status (triggered, pending, inactive)
  - Provide comprehensive endpoints for alert CRUD operations
  - Implement `toggleAlertStatus` and `getAlerts` functions for frontend integration
- Implement optimized price data caching and fallback system with improved synchronization:
  - Cache comprehensive ICP price history data with proper time-based indexing for all timeframes
  - Maintain high-frequency data points for short intervals (1-minute through 6-hour) with performance optimization
  - Provide reliable fallback data when external APIs fail
  - Ensure chart consistency by maintaining recent price entries with accurate historical resolution
  - Support precise data resampling matching timeframe requirements with accurate nanosecond conversions for each interval
  - Enhanced `getResampledPriceHistory` function with improved backend caching and resampling mechanism
  - Optimize caching strategy to handle high-frequency data while maintaining performance and data consistency
  - Synchronize caching with frontend chart refresh and timeframe switching for improved responsiveness
- Calculate technical indicators for chart display:
  - RSI calculation based on selected timeframe data with enhanced handling of varying data densities
  - MACD calculation with proper signal and histogram values across different timeframes
  - TTM Squeeze calculation with appropriate squeeze detection for all intervals
  - Provide indicator data endpoints that match the selected chart timeframe with smooth transitions
- Fetch live ICP price data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd`)
- Fetch top 50 cryptocurrencies data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`)
- Decode JSON responses from external APIs and expose clean Motoko endpoints
- Provide endpoints for:
  - Current ICP price and comprehensive historical data with precise time-based intervals
  - Chart data for all supported timeframes with accurate resampling and fallback support
  - Technical indicator data (RSI, MACD, TTM Squeeze) calculated for the selected timeframe with enhanced data density handling
  - Top 50 cryptocurrencies market data
  - Investment portfolio calculations
  - Complete price alert management with status synchronization

### Data Management
- Backend stores investment portfolio information
- Backend stores price alert configurations with comprehensive status tracking
- Backend caches extensive price data with optimized time-based indexing for reliable chart display and improved synchronization
- Backend fetches real-time price data from CoinGecko API via HTTP outcalls
- Comprehensive historical price data for all chart timeframes with cached fallbacks and precise resolution matching using accurate nanosecond conversions
- Clean data transformation from external API responses to frontend-consumable format
- Proper maintenance of high-frequency price history for accurate short-interval charts with enhanced data consistency
- Technical indicator calculations stored and served based on timeframe requirements with refined handling of varying data densities

## User Interface
- Two main sections: ICP tracker and top 50 dashboard
- Navigation between different views
- Responsive charts with comprehensive timeframe selection and reliable data display with improved load times
- Interactive hover tooltips on charts showing comprehensive information including indicator values
- Technical indicator toggle controls for RSI, MACD, and TTM Squeeze with proper chart integration and smooth transitions
- Enhanced price alert management section with full manual control and intuitive interface
- Filterable table interface for top 50 cryptocurrencies with column-specific filters
- Clean typography and modern styling
- Color coding for price changes (green for gains, red for losses)
- Visual indicators for alert states (different colors/icons for triggered, pending, inactive)
- Improved error states with actionable user feedback and graceful recovery
- Seamless chart transitions between timeframes with consistent data updates and enhanced responsiveness
- Application content displayed in English
