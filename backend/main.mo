import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Time "mo:core/Time";
import List "mo:core/List";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Nat "mo:core/Nat";

actor {
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

  type PriceCache = {
    price : Float;
    timestamp : Int;
  };

  type Timeframe = {
    name : Text; // e.g. "1m", "5m", "1h"
    intervalMinutes : Nat;
  };

  let alerts : Alerts = Map.empty<Float, Bool>();
  let icpPriceHistory = List.empty<PriceCache>();

  // Define timeframes
  let shortTimeframes : [Timeframe] = [
    { name = "1m"; intervalMinutes = 1 },
    { name = "5m"; intervalMinutes = 5 },
    { name = "15m"; intervalMinutes = 15 },
    { name = "1h"; intervalMinutes = 60 },
  ];
  let longTimeframes : [Timeframe] = [
    { name = "1d"; intervalMinutes = 1440 },
    { name = "1w"; intervalMinutes = 10080 },
  ];

  let chartTimeframes : [Timeframe] = [
    { name = "daily"; intervalMinutes = 1440 },
    { name = "weekly"; intervalMinutes = 10080 },
    { name = "monthly"; intervalMinutes = 43200 }, // 30 days
    { name = "quarterly"; intervalMinutes = 129600 }, // 90 days
    { name = "yearly"; intervalMinutes = 525600 }, // 365 days
  ];

  // Indicator types
  public type Indicator = {
    #none;
    #rsi;
    #macd;
    #ttmSqueeze;
  };

  // Chart type
  public type ChartType = {
    #line;
    #candlestick;
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getICPLivePrice() : async Text {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func getTopCryptos() : async Text {
    let url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public query ({ caller }) func getPortfolioSummary() : async ICPPortfolio {
    icpPortfolio;
  };

  public query ({ caller }) func getAlerts() : async [PriceAlertStatus] {
    let entriesArray = alerts.toArray();
    entriesArray.map(
      func((price, isTriggered)) {
        { price; isTriggered };
      }
    );
  };

  public shared ({ caller }) func toggleAlertStatus(price : Float) : async () {
    let currentStatus = switch (alerts.get(price)) {
      case (?status) { not status };
      case (null) { true };
    };
    alerts.add(price, currentStatus);
  };

  public shared ({ caller }) func cachePrice(price : Float) : async () {
    let newEntry = {
      price;
      timestamp = Time.now();
    };

    let currentTime = Time.now();
    let filtered = icpPriceHistory.filter(func(entry) { currentTime - entry.timestamp <= cacheDurationNs });

    filtered.add(newEntry);
    icpPriceHistory.clear();
    icpPriceHistory.addAll(filtered.values());
  };

  public query ({ caller }) func getCachedPriceHistory() : async [PriceCache] {
    let entriesArray = icpPriceHistory.toArray();
    entriesArray;
  };

  public query ({ caller }) func getLastCachedPrice() : async ?Float {
    switch (icpPriceHistory.last()) {
      case (?latestPrice) { ?latestPrice.price };
      case (null) { null };
    };
  };

  public query ({ caller }) func getCurrentPortfolioValue() : async Float {
    switch (icpPriceHistory.last()) {
      case (?latestPrice) { icpPortfolio.coins * latestPrice.price };
      case (null) { 0.0 };
    };
  };

  public shared ({ caller }) func recordNewICPPrice(price : Float) : async () {
    await cachePrice(price);
  };

  // Get unique timeframes
  public query ({ caller }) func getTimeframes() : async [Timeframe] {
    let combinedTimeframes = shortTimeframes.concat(longTimeframes).concat(chartTimeframes);
    let uniqueTimeframes = List.empty<Timeframe>();

    for (tf in combinedTimeframes.values()) {
      let exists = switch (uniqueTimeframes.values().find(func(existing) { existing.name == tf.name })) {
        case (?_) { true };
        case (null) { false };
      };

      if (not exists) {
        uniqueTimeframes.add(tf);
      };
    };

    uniqueTimeframes.toArray();
  };

  // Get price history for specified timeframe
  public shared ({ caller }) func getPriceHistoryForTimeframe(name : Text) : async [PriceCache] {
    let timeframe = switch (findTimeframe(name)) {
      case (?tf) { tf };
      case (null) { Runtime.trap("Timeframe not found ") };
    };
    await getResampledPriceHistory(timeframe.intervalMinutes);
  };

  func findTimeframe(name : Text) : ?Timeframe {
    let allTimeframes = shortTimeframes.concat(longTimeframes).concat(chartTimeframes);
    switch (allTimeframes.find(func(tf) { tf.name == name })) {
      case (?tf) { ?tf };
      case (null) { null };
    };
  };

  public shared ({ caller }) func getResampledPriceHistory(intervalMinutes : Nat) : async [PriceCache] {
    let intervalNanos = intervalMinutes * 60 * 1_000_000_000;
    let now = Time.now();
    let recentHistory = icpPriceHistory.filter(func(entry) { now - entry.timestamp <= cacheDurationNs }).toArray();
    if (recentHistory.size() == 0) { return [] };

    let grouped = List.empty<List.List<PriceCache>>();
    var currentGroup = List.empty<PriceCache>();
    var groupStartTime : ?Int = null;

    for (entry in recentHistory.values()) {
      switch (groupStartTime) {
        case (?startTime) {
          if (entry.timestamp - startTime <= intervalNanos) {
            currentGroup.add(entry);
          } else {
            grouped.add(currentGroup);
            currentGroup := List.empty<PriceCache>();
            currentGroup.add(entry);
            groupStartTime := ?entry.timestamp;
          };
        };
        case (null) {
          currentGroup.add(entry);
          groupStartTime := ?entry.timestamp;
        };
      };
    };

    if (currentGroup.size() > 0) {
      grouped.add(currentGroup);
    };

    let resampled = grouped.toArray().map(func(group) {
      let groupArray = group.toArray();
      if (groupArray.size() == 0) { return null };
      let sum = groupArray.foldLeft(0.0, func(acc, entry) { acc + entry.price });
      let avg = sum / groupArray.size().toFloat();
      ?{ price = avg; timestamp = groupArray[0].timestamp };
    });

    resampled.filterMap(func(x) { x });
  };
};
