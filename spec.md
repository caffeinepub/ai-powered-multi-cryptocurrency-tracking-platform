# Cryptocurrency Investment and Growth Application

## Overview
A comprehensive cryptocurrency investment and growth application that combines portfolio simulation, live investment tracking, and advanced market analysis. The platform provides real-time price monitoring for ICP and displays market data for the top 100 cryptocurrencies, while offering investment planning and growth simulation tools with AI-powered analytics. The application features a modern, responsive design with enhanced usability and performance optimizations.

## Core Features

### Enhanced Portfolio Growth Simulator with Real-Time Integration
- Rebuild the Portfolio Growth Simulator with intuitive dropdown menus for each configuration section:
  - Investment selection dropdown with searchable cryptocurrency options
  - Growth projection dropdown with predefined scenarios (conservative, moderate, aggressive)
  - Timeframe dropdown with options (1 month, 3 months, 6 months, 1 year, 2 years, 5 years)
  - Strategy type dropdown (DCA, lump sum, hybrid)
  - Risk level dropdown (low, medium, high)
- Link simulator charts in real-time to the user's active cryptocurrency investments
- Dynamically recalculate projections and ROI as live data updates
- Use real historical data from top cryptocurrencies for accurate simulations
- Apply different market conditions (bull market, bear market, sideways market) to projections
- Show projected timeline to reach investment goals under various scenarios
- Display enhanced growth charts with optimized calculation logic and improved visual layout and responsiveness
- Compare performance across different cryptocurrency portfolios
- Provide intelligent adjustment suggestions for portfolio configuration using live market trends from the top 100 cryptocurrencies for realistic growth projections
- Enhanced interactive interface with smoother animations, modern aesthetics, and simplified navigation for user accessibility
- Optimized calculation performance for faster simulation results

### Investment Recommendations and Alerts System
- Generate real-time investment recommendations based on technical indicators
- Use RSI, MACD, and TTM Squeeze for trend and momentum analysis
- Provide buy/sell/hold recommendations with confidence levels
- Alert users when favorable investment opportunities arise
- Show recommendation history and performance tracking
- Allow users to customize recommendation sensitivity and criteria
- Enhanced AI-powered sentiment, volatility, and trend indicators with improved visual clarity

### Enhanced ICP Live Price Tracker with Fixed Real-Time Updates
- Display a robust dynamic chart showing continuous real-time ICP price changes with fixed scaling and visual alignment across timeframes
- Fixed real-time date and timestamp display that updates dynamically with each price update
- Enhanced backend data refresh cycle with improved synchronization between price, date, and daily high/low stats
- Improved frontend state management to ensure real-time synchronization of all price-related data
- Advanced backend data retrieval with improved caching and fallback logic for consistent performance during network delays or API downtime
- Smoother price updates with advanced processing and precise daily high/low tracking with synchronized timestamps
- Richer visual data representation with enhanced frontend rendering and GPU-accelerated animations
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
- Display dynamic 24-hour high and low prices with precise tracking and synchronized timestamps
- Show investment portfolio summary with accurate real-time calculations
- Optimized charting performance with caching and adaptive rendering

### Top 100 Cryptocurrencies Dashboard
- Display live data for the top 100 cryptocurrencies by market capitalization
- Show for each cryptocurrency:
  - Current price in USD
  - 24-hour percentage change
  - Market capitalization
  - Cryptocurrency name and symbol
- Implement enhanced column filtering and sorting functionality:
  - Refined search and filters for Name, Symbol, Price, 24h Change, and Market Cap columns
  - Sort by any column in ascending or descending order
  - User-friendly filter inputs positioned above or within column headers
  - Real-time search functionality with instant results
- Enhanced live refresh frequency with smart throttling to balance performance and accuracy
- Improved AI-powered analyses integration with better visuals and clarity
- Responsive dropdown menu with real-time search functionality for asset selection
- Provide market trend data for intelligent portfolio adjustment suggestions

### Personalized Investment Planner
- Help users allocate funds across different cryptocurrencies
- Monitor portfolio performance with detailed analytics
- Show profitability projections based on historical data and market trends
- Provide diversification recommendations
- Track investment goals and progress
- Calculate optimal allocation percentages based on risk tolerance
- Display expected returns and risk metrics for different allocation strategies
- Enhanced interactive interface with improved data readability

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
- Enhanced AI-powered analytics suggestions across all dashboard sections
- Provide insights including:
  - Trend strength analysis
  - Volatility detection and alerts
  - Smart recommendation summaries
  - Sentiment analysis with improved visual indicators
- Leverage real-time performance metrics for enhanced insights
- Display analytics as optional overlays or dedicated sections with better clarity

## Technical Requirements

### Frontend
- Modern, redesigned React user interface with enhanced UI/UX design for smoother animations, cohesive layout transitions, and intuitive interactivity
- Enhanced responsive design optimized for desktop and mobile with improved visual transitions and animations
- GPU-accelerated animations and UI updates for optimal performance
- Responsive, easy-to-use dropdown menu with real-time search functionality for navigation and asset selection
- Interactive price charts for ICP visualization with fixed continuous real-time updates and consistent scaling across timeframes
- Fixed real-time date and timestamp display with dynamic updates synchronized to price changes
- Improved frontend state management for real-time synchronization of price, date, and daily high/low data
- Adaptive chart behavior with fallback data handling and caching for improved performance
- Customizable indicator colors for technical analysis tools
- Rebuilt Portfolio Growth Simulator interface with:
  - Intuitive dropdown menus for each configuration section
  - Real-time integration with user's active cryptocurrency investments
  - Dynamic recalculation of projections and ROI as live data updates
  - Enhanced interactive charts with improved visual layout and responsiveness
  - Smoother animations and modern aesthetics
  - Simplified navigation for user accessibility
  - Optimized calculation display for faster results
- Investment recommendation dashboard with real-time alerts and historical tracking
- Investment planner interface with improved allocation tools and performance projections
- Enhanced sortable and filterable table for top 100 cryptocurrencies with refined search functionality
- Real-time data updates without page refresh with smoother animations
- Comprehensive price alert management interface
- React Query integration with mutation hooks for all data management
- Enhanced error handling with graceful recovery and fallback data display
- Call backend endpoints instead of external APIs directly
- Portfolio Summary component with real-time investment calculations
- Enhanced hover tooltips with consistent live updates
- AI-powered analytics display components with improved visual clarity
- Improved color schemes, typography, and dark/light mode balance
- Accessibility optimizations (ARIA compliance, keyboard navigation, contrast ratios)
- Cleaner layout spacing and polished interface design
- Consistent design language across live and simulated chart components
- Professional visual presentation with accuracy across all timeframes
- Improved clarity of investment insights, slider and dropdown controls
- Enhanced responsive behaviors on all device types

### Backend
- Optimized backend data flow to ensure faster, more accurate delivery of live user data to all front-end components
- Reduced latency and maintained smooth synchronization across all components
- Enhanced data refresh cycle with improved real-time synchronization between price, date, and daily high/low stats
- Fixed timestamp management to ensure current live date updates dynamically with each price update
- Refactored data flow architecture for more efficient real-time updates and reduced latency
- Enhanced data retrieval system with improved caching and fallback logic for reliable performance
- Improved robustness of HTTP calls for fetching ICP and Top 100 cryptocurrency data with high reliability and accuracy
- Advanced processing for smoother price updates and precise daily high/low tracking with synchronized timestamps
- Store user's ICP investment data and portfolio allocations
- Store and manage price alerts with enhanced functionality
- Store investment recommendations and their performance history
- Store portfolio simulation parameters and results with optimized calculation logic
- Store investment planner data including allocation strategies and goals
- Implement optimized price data caching and fallback system with enhanced timeframe support and network resilience
- Track and provide 24-hour high/low price data with precise calculations and synchronized timestamps
- Calculate technical indicators for chart display with enhanced timeframe compatibility
- Generate investment recommendations based on technical analysis
- Perform portfolio growth simulations using historical data with optimized calculation performance
- Generate intelligent adjustment suggestions for portfolio configuration using live market trends from top 100 cryptocurrencies
- Calculate investment planner projections and allocation recommendations
- Fetch live ICP price data from CoinGecko API using HTTP outcalls with enhanced reliability
- Fetch top 100 cryptocurrencies data from CoinGecko API using HTTP outcalls
- Fetch historical data for multiple cryptocurrencies for simulation purposes
- Upgraded API error handling and response normalization for consistent frontend data formatting
- Decode JSON responses from external APIs and expose clean Motoko endpoints
- AI-powered analytics processing for trend analysis, volatility detection, and smart recommendations
- Provide endpoints for:
  - Current ICP price and comprehensive historical data with enhanced reliability and synchronized timestamps
  - Portfolio simulation results and projections with optimized calculations and real-time integration
  - Investment recommendations and alerts
  - Investment planner calculations and allocations
  - Chart data for all supported timeframes with fallback handling
  - Technical indicator data with customizable parameters
  - Top 100 cryptocurrencies market data with smart refresh throttling
  - Investment portfolio calculations with real-time profit/loss metrics
  - Complete price alert management
  - AI-powered analytics insights and recommendations
  - Intelligent portfolio adjustment suggestions based on market trends

### Data Management
- Backend stores investment portfolio information and allocation strategies
- Backend stores price alert configurations with comprehensive status tracking
- Backend stores investment recommendations and their historical performance
- Backend stores portfolio simulation data and results with optimized storage
- Backend stores investment planner configurations and projections
- Enhanced backend caches extensive price data with optimized time-based indexing and fallback mechanisms
- Backend tracks and calculates 24-hour high/low prices from cached price data with precision and synchronized timestamps
- Backend fetches real-time price data from CoinGecko API via HTTP outcalls with enhanced reliability
- Backend fetches historical data for multiple cryptocurrencies for simulation and analysis
- Comprehensive historical price data for all chart timeframes with cached fallbacks and network resilience
- Technical indicator calculations stored and served based on timeframe requirements
- Real-time portfolio value calculations based on current prices and stored investment data
- AI analytics data processing and storage for trend analysis and recommendations
- Market trend data storage for intelligent portfolio adjustment suggestions

## User Interface
- Multiple main sections: ICP tracker, top 100 dashboard, portfolio simulator, investment recommendations, investment planner, and AI analytics
- Enhanced navigation between different views with responsive dropdown menu and real-time search functionality
- Responsive charts with enhanced timeframe selection controls and customizable indicator colors
- Fixed real-time date and timestamp display that updates dynamically with price changes
- Interactive hover tooltips on charts showing comprehensive information with consistent updates
- Technical indicator toggle controls with color customization options
- Rebuilt Portfolio Growth Simulator interface with:
  - Intuitive dropdown menus for each configuration section
  - Real-time integration with user's active cryptocurrency investments
  - Enhanced interactive parameter controls with streamlined design
  - Improved visual layout and responsiveness of growth simulation chart
  - Smoother animations and modern aesthetics
  - Simplified navigation for user accessibility
- Investment recommendation dashboard with alert management and improved visual clarity
- Investment planner with enhanced allocation tools and performance projections
- Dynamic 24-hour high/low display with clean formatting and precise tracking
- Enhanced price alert management section with full manual control
- Refined filterable and sortable table interface for top 100 cryptocurrencies with real-time search
- Modern typography and styling with improved color schemes and dark/light mode balance
- Color coding for price changes (green for gains, red for losses)
- Visual indicators for alert states and recommendation confidence levels
- Improved error states with actionable user feedback and graceful recovery with fallback data display
- Portfolio Summary section with clear, responsive formatting
- AI-powered analytics sections with enhanced visual clarity and optional visibility
- GPU-accelerated animations and smooth visual transitions
- Accessibility optimizations for ARIA compliance, keyboard navigation, and contrast ratios
- Cleaner layout spacing and polished interface design
- Consistent design language across live and simulated chart components
- Professional visual presentation with accuracy maintained across all timeframes
- Enhanced clarity of investment insights, slider and dropdown controls
- Improved responsive behaviors on all device types
- Application content displayed in English
