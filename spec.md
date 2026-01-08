# Cryptocurrency Tracking Platform

## Overview
A cryptocurrency tracking platform that provides real-time price monitoring for ICP and displays market data for the top 50 cryptocurrencies.

## Core Features

### ICP Live Price Tracker
- Display a dynamic chart showing real-time ICP price changes with continuous updates
- Implement price alert system with predefined target prices: $3.567, $4.885, $6.152, and $9.828
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
- Interactive price charts for ICP visualization
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
- Store price alert targets and their status
- Fetch live ICP price data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd`)
- Fetch top 50 cryptocurrencies data from CoinGecko API using HTTP outcalls (`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`)
- Decode JSON responses from external APIs and expose clean Motoko endpoints
- Provide endpoints for:
  - Current ICP price and historical data
  - Top 50 cryptocurrencies market data
  - Investment portfolio calculations
  - Price alert management

### Data Management
- Backend stores investment portfolio information
- Backend stores price alert configurations
- Backend fetches real-time price data from CoinGecko API via HTTP outcalls
- Historical price data for chart visualization
- Clean data transformation from external API responses to frontend-consumable format

## User Interface
- Two main sections: ICP tracker and top 50 dashboard
- Navigation between different views
- Responsive charts and tables
- Clean typography and modern styling
- Color coding for price changes (green for gains, red for losses)
- Improved error states with actionable user feedback
- Application content displayed in English
