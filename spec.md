# Cryptocurrency Investment and Growth Application

## Overview
A comprehensive cryptocurrency investment and growth application that combines portfolio simulation, live investment tracking, and advanced market analysis. The platform provides real-time price monitoring for ICP and displays market data for the top 50 cryptocurrencies, while offering investment planning and growth simulation tools.

## Core Features

### Portfolio Growth Simulator
- Simulate portfolio growth from $1,000 starting investment to $10,000 goal
- Use real historical data from top cryptocurrencies for accurate simulations
- Apply different market conditions (bull market, bear market, sideways market) to projections
- Show projected timeline to reach investment goals under various scenarios
- Display growth charts with different allocation strategies
- Allow users to adjust simulation parameters (starting amount, target amount, time horizon)
- Compare performance across different cryptocurrency portfolios

### Investment Recommendations and Alerts System
- Generate real-time investment recommendations based on technical indicators
- Use RSI, MACD, and TTM Squeeze for trend and momentum analysis
- Provide buy/sell/hold recommendations with confidence levels
- Alert users when favorable investment opportunities arise
- Show recommendation history and performance tracking
- Allow users to customize recommendation sensitivity and criteria

### ICP Live Price Tracker
- Display a robust dynamic chart showing real-time ICP price changes with continuous updates and reliable data display
- Implement comprehensive chart timeframe selection with enhanced UI controls:
  - Short-term intervals: 1-minute, 2-minute, 3-minute, 5-minute, 10-minute, 15-minute, 30-minute
  - Medium-term intervals: 1-hour, 2-hour, 4-hour, 6-hour
  - Long-term intervals: 1-day, 1-month, 1-quarter, 1-year
  - Enhanced timeframe selector UI with clear labeling and visual differentiation
  - Hover tooltips for each timeframe describing data density and update frequency
  - Visual feedback for the currently active timeframe with distinct styling
  - Smooth navigation between timeframes with improved responsiveness
- Implement enhanced chart data system with optimized data fetching and transitions
- Interactive chart hover tooltips displaying comprehensive details including precise date/time, price, and indicator values
- Technical indicator system with customizable colors:
  - Optional RSI, MACD, and TTM Squeeze indicators with toggle functionality
  - Customizable indicator colors for personalized chart visualization
  - Each indicator calculates and renders correctly based on selected timeframe
  - Interactive controls to enable/disable each indicator independently
- Comprehensive price alert system with manual management
- Display dynamic 24-hour high and low prices
- Show investment portfolio summary with accurate real-time calculations

### Top 50 Cryptocurrencies Dashboard
- Display live data for the top 50 cryptocurrencies by market capitalization
- Show for each cryptocurrency:
  - Current price in USD
  - 24-hour percentage change
  - Market capitalization
  - Cryptocurrency name and symbol
- Implement column filtering and sorting functionality:
  - Filter by Name, Symbol, Price, 24h Change, and Market Cap
  - Sort by any column in ascending or descending order
  - User-friendly filter inputs positioned above or within column headers
- Automatically refresh data at regular intervals to maintain accuracy

### Personalized Investment Planner
- Help users allocate funds across different cryptocurrencies
- Monitor portfolio performance with detailed analytics
- Show profitability projections based on historical data and market trends
- Provide diversification recommendations
- Track investment goals and progress
- Calculate optimal allocation percentages based on risk tolerance
- Display expected returns and risk metrics for different allocation strategies

### Portfolio Summary
- Display user's real holdings with comprehensive metrics:
  - Total coins: 1864 ICP
  - Average cost: $6.152
  - Current total value (calculated in real-time based on live ICP price)
  - Current profit/loss percentage and amount (unrealized gains/losses)
  - ROI visualization with clear formatting
- Dynamic updates in real time when ICP price changes
- Responsive formatting for both desktop and mobile devices
- Clear display of both absolute profit/loss values and percentage changes

## Technical Requirements

### Frontend
- Clean, modern React user interface optimized for clarity and responsiveness
- Responsive design that works on desktop and mobile devices
- Interactive price charts for ICP visualization with enhanced timeframe selection controls
- Customizable indicator colors for technical analysis tools
- Portfolio growth simulation interface with interactive charts and parameter controls
- Investment recommendation dashboard with real-time alerts and historical tracking
- Investment planner interface with allocation tools and performance projections
- Sortable and filterable table for top 50 cryptocurrencies with column-specific filters
- Real-time data updates without page refresh
- Comprehensive price alert management interface
- React Query integration with mutation hooks for all data management
- Enhanced error handling with graceful recovery
- Call backend endpoints instead of external APIs directly
- Portfolio Summary component with real-time investment calculations

### Backend
- Store user's ICP investment data and portfolio allocations
- Store and manage price alerts with enhanced functionality
- Store investment recommendations and their performance history
- Store portfolio simulation parameters and results
- Store investment planner data including allocation strategies and goals
- Implement optimized price data caching and fallback system with enhanced timeframe support
- Track and provide 24-hour high/low price data
- Calculate technical indicators for chart display with enhanced timeframe compatibility
- Generate investment recommendations based on technical analysis
- Perform portfolio growth simulations using historical data
- Calculate investment planner projections and allocation recommendations
- Fetch live ICP price data from CoinGecko API using HTTP outcalls
- Fetch top 50 cryptocurrencies data from CoinGecko API using HTTP outcalls
- Fetch historical data for multiple cryptocurrencies for simulation purposes
- Decode JSON responses from external APIs and expose clean Motoko endpoints
- Provide endpoints for:
  - Current ICP price and comprehensive historical data
  - Portfolio simulation results and projections
  - Investment recommendations and alerts
  - Investment planner calculations and allocations
  - Chart data for all supported timeframes
  - Technical indicator data with customizable parameters
  - Top 50 cryptocurrencies market data
  - Investment portfolio calculations with real-time profit/loss metrics
  - Complete price alert management

### Data Management
- Backend stores investment portfolio information and allocation strategies
- Backend stores price alert configurations with comprehensive status tracking
- Backend stores investment recommendations and their historical performance
- Backend stores portfolio simulation data and results
- Backend stores investment planner configurations and projections
- Backend caches extensive price data with optimized time-based indexing
- Backend tracks and calculates 24-hour high/low prices from cached price data
- Backend fetches real-time price data from CoinGecko API via HTTP outcalls
- Backend fetches historical data for multiple cryptocurrencies for simulation and analysis
- Comprehensive historical price data for all chart timeframes with cached fallbacks
- Technical indicator calculations stored and served based on timeframe requirements
- Real-time portfolio value calculations based on current prices and stored investment data

## User Interface
- Multiple main sections: ICP tracker, top 50 dashboard, portfolio simulator, investment recommendations, and investment planner
- Navigation between different views with clear section indicators
- Responsive charts with enhanced timeframe selection controls and customizable indicator colors
- Interactive hover tooltips on charts showing comprehensive information
- Technical indicator toggle controls with color customization options
- Portfolio growth simulation interface with interactive parameter controls
- Investment recommendation dashboard with alert management
- Investment planner with allocation tools and performance projections
- Dynamic 24-hour high/low display with clean formatting
- Enhanced price alert management section with full manual control
- Filterable and sortable table interface for top 50 cryptocurrencies
- Clean typography and modern styling optimized for clarity
- Color coding for price changes (green for gains, red for losses)
- Visual indicators for alert states and recommendation confidence levels
- Improved error states with actionable user feedback and graceful recovery
- Portfolio Summary section with clear, responsive formatting
- Application content displayed in English
