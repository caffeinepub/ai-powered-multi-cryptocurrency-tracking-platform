import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Time "mo:core/Time";
import List "mo:core/List";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Text "mo:core/Text";

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

  let alerts : Alerts = Map.empty<Float, Bool>();
  let icpPriceHistory = List.empty<PriceCache>();

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

  public shared ({ caller }) func getTopCryptos() : async Text {
    let url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false";
    let res = await OutCall.httpGetRequest(url, [], transform);

    if (res.size() >= 2) {
      res;
    } else {
      Runtime.trap("Invalid top cryptos response: " # res);
    };
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
    let isTriggered = switch (alerts.get(price)) {
      case (?currentStatus) { not currentStatus };
      case (null) { true };
    };
    alerts.add(price, isTriggered);
  };

  public shared ({ caller }) func addPriceToCache(price : Float) : async () {
    let newEntry = {
      price;
      timestamp = Time.now();
    };

    let now = Time.now();
    let filtered = icpPriceHistory.filter(func(entry) { now - entry.timestamp <= cacheDurationNs });

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

  public shared ({ caller }) func getResampledPriceHistory(intervalMinutes : Nat) : async [PriceCache] {
    let now = Time.now();
    let recentHistory = icpPriceHistory.filter(func(entry) { now - entry.timestamp <= cacheDurationNs }).toArray();
    if (recentHistory.size() == 0) { return [] };
    let intervalNanos = intervalMinutes * 60 * 1_000_000_000;
    let grouped = List.empty<List.List<PriceCache>>();
    var currentGroup = List.empty<PriceCache>();
    var groupStartTime : ?Int = null;

    for (entry in recentHistory.values()) {
      switch (groupStartTime) {
        case (?startTime) {
          if (entry.timestamp - startTime <= intervalNanos * 1) {
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
      var sum : Float = 0;
      for (entry in groupArray.values()) { sum += entry.price };
      let avg = sum / groupArray.size().toFloat();
      ?{ price = avg; timestamp = groupArray[0].timestamp };
    });
    resampled.filterMap(func(x) { x });
  };

  public query ({ caller }) func getPriceHistoryForHours(hours : Nat) : async [PriceCache] {
    let now = Time.now();
    let intervalNanos = hours * 60 * 60 * 1_000_000_000;

    let filtered = icpPriceHistory.filter(func(entry) { now - entry.timestamp <= intervalNanos });
    filtered.toArray();
  };
};
