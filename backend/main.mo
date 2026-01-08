import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Float "mo:core/Float";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Migration "migration";

(with migration = Migration.run)
actor {
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

  let alerts : Alerts = Map.empty<Float, Bool>();

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
};
