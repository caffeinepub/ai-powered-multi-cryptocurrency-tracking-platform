import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import OutCall "http-outcalls/outcall";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Migration "migration";

(with migration = Migration.run)
actor {
  let cacheDurationNs = 24 * 60 * 60 * 1_000_000_000;
  type Alerts = Map.Map<Float, Bool>;

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

  // Alert system
  let alerts : Alerts = Map.empty<Float, Bool>();

  let icpPriceHistory = List.empty<PriceCache>();

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
    icpPriceHistory.toArray();
  };

  public shared ({ caller }) func recordNewICPPrice(price : Float) : async () {
    await cachePrice(price);
  };

  public type Timeframe = {
    name : Text; // 1m, 2m, 3m, 5m, 10m, 15m, 30m, 1h, 2h, 4h, 6h, 1d, 1mo, 1q, 1y
    intervalMinutes : Nat;
  };

  func getMinutesForTimeframe(name : Text) : Nat {
    switch (name) {
      case ("m") { 1 };
      case ("2m") { 2 };
      case ("3m") { 3 };
      case ("5m") { 5 };
      case ("10m") { 10 };
      case ("15m") { 15 };
      case ("30m") { 30 };
      case ("1h") { 60 };
      case ("2h") { 120 };
      case ("4h") { 240 };
      case ("6h") { 360 };
      case ("1d") { 1440 };
      case ("1mo") { 43200 };
      case ("1q") { 129600 };
      case ("1y") { 525600 };
      case (_) { 1 };
    };
  };

  public shared ({ caller }) func getHistoricalPriceHistory(timeframe : Text) : async [PriceCache] {
    let intervalNanos = getMinutesForTimeframe(timeframe) * 60 * 1_000_000_000;
    await getResampledPriceHistory(intervalNanos);
  };

  public shared ({ caller }) func getResampledPriceHistory(intervalNanos : Nat) : async [PriceCache] {
    let intervalNs = intervalNanos.toInt();
    let now = Time.now();
    let recentHistory = icpPriceHistory.filter(func(entry) { now - entry.timestamp <= cacheDurationNs }).toArray();
    if (recentHistory.size() == 0) { return [] };

    let grouped = List.empty<List.List<PriceCache>>();
    var currentGroup = List.empty<PriceCache>();
    var groupStartTime : ?Int = null;

    for (entry in recentHistory.values()) {
      switch (groupStartTime) {
        case (?startTime) {
          if (entry.timestamp - startTime <= intervalNs) {
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

  public shared ({ caller }) func getHistoricalDataRange() : async {
    start : Int;
    end : Int;
  } {
    let entries = icpPriceHistory.toArray();
    if (entries.size() == 0) {
      { start = 0; end = 0 };
    } else if (entries.size() == 1) {
      { start = entries[0].timestamp; end = entries[0].timestamp };
    } else {
      var min = entries[0].timestamp;
      var max = entries[0].timestamp;
      let entriesIter = entries.sliceToArray(1, entries.size()).values();

      for (entry in entriesIter) {
        if (entry.timestamp < min) { min := entry.timestamp };
        if (entry.timestamp > max) { max := entry.timestamp };
      };
      { start = min; end = max };
    };
  };
};
