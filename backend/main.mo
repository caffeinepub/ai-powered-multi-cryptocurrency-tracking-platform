import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Time "mo:core/Time";
import List "mo:core/List";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Migration "migration";
import Int "mo:core/Int";

(with migration = Migration.run)
actor {
  // 24 hours in nanoseconds for cycle
  let cacheDurationNs = 24 * 60 * 60 * 1_000_000_000;

  type Alerts = Map.Map<Float, Bool>;
  type ICPPortfolio = {
    coins : Float;
    avgCost : Float;
  };

  var icpPortfolio : ICPPortfolio = {
    coins = 1864.0;
    avgCost = 6.152;
  };

  type PriceAlertStatus = {
    price : Float;
    isTriggered : Bool;
  };

  public type Coin = {
    id : Text;
    symbol : Text;
    name : Text;
    currentPrice : Float;
    marketCap : ?Float;
    priceChange24h : ?Float;
  };

  // Cached ICP price data with timestamp
  type PriceCache = {
    price : Float;
    timestamp : Int;
  };

  let alerts : Alerts = Map.empty<Float, Bool>();
  let icpPriceHistory = List.empty<PriceCache>();

  // 1. Live ICP Price Tracker

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getICPLivePrice() : async Text {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd";
    let res = await OutCall.httpGetRequest(url, [], transform);

    if (res.size() >= 2) {
      res;
    } else {
      Runtime.trap("Invalid ICP price response: " # res);
    };
  };

  // 2. Top 50 Cryptocurrencies

  public shared ({ caller }) func getTopCryptos() : async Text {
    let url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false";
    let res = await OutCall.httpGetRequest(url, [], transform);

    if (res.size() >= 2) {
      res;
    } else {
      Runtime.trap("Invalid top cryptos response: " # res);
    };
  };

  // 3. Portfolio

  public query ({ caller }) func getPortfolioSummary() : async ICPPortfolio {
    icpPortfolio;
  };

  // 4. Price Alerts

  public query ({ caller }) func getAlerts() : async [PriceAlertStatus] {
    alerts.entries().map(func((price, isTriggered)) { { price; isTriggered } }).toArray();
  };

  public shared ({ caller }) func toggleAlertStatus(price : Float) : async () {
    let isTriggered = switch (alerts.get(price)) {
      case (?currentStatus) { not currentStatus };
      case (null) { true };
    };
    alerts.add(price, isTriggered);
  };

  // 5. ICP Price History Cache

  public shared ({ caller }) func addPriceToCache(price : Float) : async () {
    let newEntry = {
      price;
      timestamp = Time.now();
    };

    // Remove entries older than 24h
    let now = Time.now();
    let filtered = icpPriceHistory.filter(func(entry) { now - entry.timestamp <= cacheDurationNs });

    // Add new price and update cache
    filtered.add(newEntry);
    icpPriceHistory.clear();
    icpPriceHistory.addAll(filtered.values());
  };

  public query ({ caller }) func getCachedPriceHistory() : async [PriceCache] {
    let now = Time.now();
    let recent = icpPriceHistory.filter(func(entry) { now - entry.timestamp <= cacheDurationNs });
    recent.toArray();
  };

  public shared ({ caller }) func getLastCachedPrice() : async ?Float {
    if (icpPriceHistory.isEmpty()) { return null };

    let now = Time.now();
    let recent = icpPriceHistory.filter(func(entry) { now - entry.timestamp <= cacheDurationNs });

    if (recent.isEmpty()) { return null };
    ?recent.at(0).price;
  };

  public query ({ caller }) func getCurrentPortfolioValue() : async Float {
    switch (icpPriceHistory.last()) {
      case (?latestPrice) { icpPortfolio.coins * latestPrice.price };
      case (null) { 0.0 };
    };
  };

  public shared ({ caller }) func recordNewICPPrice(price : Float) : async () {
    await addPriceToCache(price);
  };
};

