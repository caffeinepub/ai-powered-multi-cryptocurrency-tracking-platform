# Cryptocurrency Investment and Growth Application

## Overview
A comprehensive cryptocurrency investment and growth application that combines portfolio simulation, live investment tracking, and advanced market analysis. The platform provides real-time price monitoring for ICP and displays market data for the top 100 cryptocurrencies, while offering investment planning and growth simulation tools with AI-powered analytics.

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

### Enhanced ICP Live Price Tracker
- Display a robust dynamic chart showing real-time ICP price changes with enhanced reliability and continuous updates
- Advanced backend data retrieval with improved caching and fallback logic for consistent performance during network delays or API downtime
- Smoother price updates with advanced processing and precise daily high/low tracking
- Richer visual data representation with enhanced frontend rendering
- Implement comprehensive chart timeframe selection with enhanced UI controls:
  - Short-term intervals: 1-minute, 2-minute, 3-minute, 5-minute, 10-minute, 15-minute, 30-minute
  - Medium-term intervals: 1-hour, 2-hour, 4-hour, 6-hour
  - Long-term intervals: 1-day, 1-month, 1-quarter, 1-year
  - Enhanced timeframe selector UI with clear labeling and visual differentiation
  - Hover tooltips for each timeframe describing data density and update frequency
  - Visual feedback for the currently active timeframe with distinct styling
  - Smooth navigation between timeframes with improved responsiveness
- Implement enhanced chart data system with optimized data fetching and smooth transitions
- Interactive chart hover tooltips displaying comprehensive details including precise date/time, price, and indicator values
- Technical indicator system with customizable colors:
  - Optional RSI, MACD, and TTM Squeeze indicators with toggle functionality
  - Customizable indicator colors for personalized chart visualization
  - Each indicator calculates and renders correctly based on selected timeframe
  - Interactive controls to enable/disable each indicator independently
- Comprehensive price alert system with manual management
- Display dynamic 24-hour high and low prices with precise tracking
- Show investment portfolio summary with accurate real-time calculations

### Top 100 Cryptocurrencies Dashboard
- Display live data for the top 100 cryptocurrencies by market capitalization (expanded from top 50)
- Show for each cryptocurrency:
  - Current price in USD
  - 24-hour percentage change
  - Market capitalization
  - Cryptocurrency name and symbol
- Implement column filtering and sorting functionality:
  - Filter by Name, Symbol, Price, 24h Change, and Market Cap
  - Sort by any column in ascending or descending order
  - User-friendly filter inputs positioned above or within column headers
- Dynamic refresh intervals with optimized performance
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

### AI-Powered Analytics
- Optional AI-powered analytics suggestions across all dashboard sections
- Provide insights including:
  - Trend strength analysis
  - Volatility detection and alerts
  - Smart recommendation summaries
- Leverage real-time performance metrics for enhanced insights
- Display analytics as optional overlays or dedicated sections

## Technical Requirements

### Frontend
- Clean, modern React user interface optimized for clarity and responsiveness with enhanced animations
- Responsive design that works on desktop and mobile devices with refined transitions
- Interactive price charts for ICP visualization with enhanced timeframe selection controls and smoother rendering
- Adaptive chart behavior with fallback data handling
- Customizable indicator colors for technical analysis tools
- Portfolio growth simulation interface with interactive charts and parameter controls
- Investment recommendation dashboard with real-time alerts and historical tracking
- Investment planner interface with allocation tools and performance projections
- Sortable and filterable table for top 100 cryptocurrencies with column-specific filters
- Real-time data updates without page refresh with smoother animations
- Comprehensive price alert management interface
- React Query integration with mutation hooks for all data management
- Enhanced error handling with graceful recovery and fallback data display
- Call backend endpoints instead of external APIs directly
- Portfolio Summary component with real-time investment calculations
- Enhanced hover tooltips with consistent live updates
- AI-powered analytics display components with optional visibility controls

### Backend
- Enhanced data retrieval system with improved caching and fallback logic for reliable performance
- Advanced processing for smoother price updates and precise daily high/low tracking
- Store user's ICP investment data and portfolio allocations
- Store and manage price alerts with enhanced functionality
- Store investment recommendations and their performance history
- Store portfolio simulation parameters and results
- Store investment planner data including allocation strategies and goals
- Implement optimized price data caching and fallback system with enhanced timeframe support and network resilience
- Track and provide 24-hour high/low price data with precise calculations
- Calculate technical indicators for chart display with enhanced timeframe compatibility
- Generate investment recommendations based on technical analysis
- Perform portfolio growth simulations using historical data
- Calculate investment planner projections and allocation recommendations
- Fetch live ICP price data from CoinGecko API using HTTP outcalls with enhanced reliability
- Fetch top 100 cryptocurrencies data from CoinGecko API using HTTP outcalls (expanded from top 50)
- Fetch historical data for multiple cryptocurrencies for simulation purposes
- Decode JSON responses from external APIs and expose clean Motoko endpoints
- AI-powered analytics processing for trend analysis, volatility detection, and smart recommendations
- Provide endpoints for:
  - Current ICP price and comprehensive historical data with enhanced reliability
  - Portfolio simulation results and projections
  - Investment recommendations and alerts
  - Investment planner calculations and allocations
  - Chart data for all supported timeframes with fallback handling
  - Technical indicator data with customizable parameters
  - Top 100 cryptocurrencies market data with dynamic refresh
  - Investment portfolio calculations with real-time profit/loss metrics
  - Complete price alert management
  - AI-powered analytics insights and recommendations

### Data Management
- Backend stores investment portfolio information and allocation strategies
- Backend stores price alert configurations with comprehensive status tracking
- Backend stores investment recommendations and their historical performance
- Backend stores portfolio simulation data and results
- Backend stores investment planner configurations and projections
- Enhanced backend caches extensive price data with optimized time-based indexing and fallback mechanisms
- Backend tracks and calculates 24-hour high/low prices from cached price data with precision
- Backend fetches real-time price data from CoinGecko API via HTTP outcalls with enhanced reliability
- Backend fetches historical data for multiple cryptocurrencies for simulation and analysis
- Comprehensive historical price data for all chart timeframes with cached fallbacks and network resilience
- Technical indicator calculations stored and served based on timeframe requirements
- Real-time portfolio value calculations based on current prices and stored investment data
- AI analytics data processing and storage for trend analysis and recommendations

## User Interface
- Multiple main sections: ICP tracker, top 100 dashboard, portfolio simulator, investment recommendations, investment planner, and AI analytics
- Navigation between different views with clear section indicators and smooth transitions
- Responsive charts with enhanced timeframe selection controls and customizable indicator colors
- Interactive hover tooltips on charts showing comprehensive information with consistent updates
- Technical indicator toggle controls with color customization options
- Portfolio growth simulation interface with interactive parameter controls
- Investment recommendation dashboard with alert management
- Investment planner with allocation tools and performance projections
- Dynamic 24-hour high/low display with clean formatting and precise tracking
- Enhanced price alert management section with full manual control
- Filterable and sortable table interface for top 100 cryptocurrencies with optimized performance
- Clean typography and modern styling optimized for clarity with refined animations
- Color coding for price changes (green for gains, red for losses)
- Visual indicators for alert states and recommendation confidence levels
- Improved error states with actionable user feedback and graceful recovery with fallback data display
- Portfolio Summary section with clear, responsive formatting
- AI-powered analytics sections with optional visibility and smart insights display
- Enhanced responsiveness for desktop and mobile with adaptive behavior
- Application content displayed in English
