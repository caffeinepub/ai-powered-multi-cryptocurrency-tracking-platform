import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Set "mo:core/Set";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Types
  type ICPPortfolio = {
    coins : Float;
    avgCost : Float;
  };

  public type AlertStatus = {
    price : Float;
    isActive : Bool;
  };

  public type CandleStick = {
    timestamp : Nat;
    price : Float;
  };

  public type Coin = {
    id : Text;
    symbol : Text;
    name : Text;
    currentPrice : Float;
    marketCap : ?Float;
    priceChange24h : ?Float;
  };

  // State
  let alertsMap = Map.empty<Float, Bool>();
  let historicalPrices = List.empty<Float>();
  let timestamps = List.empty<Nat>();

  var icpPortfolio : ICPPortfolio = {
    coins = 1864.0;
    avgCost = 6.152;
  };

  // 1. Live ICP Price Tracker

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getICPLivePrice() : async Text {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd";
    let res = await OutCall.httpGetRequest(url, [], transform);

    if (res.size() >= 2) { res } else { Runtime.trap("Invalid ICP price response: " # res) };
  };

  // 3. Portfolio

  public query ({ caller }) func getPortfolioSummary() : async ICPPortfolio {
    icpPortfolio;
  };

  // 4. Price Alerts
  public query ({ caller }) func getAlertList() : async [AlertStatus] {
    alertsMap.entries().map(func((price, active)) { { price; isActive = active } }).toArray();
  };

  public shared ({ caller }) func setAlertActive(price : Float, active : Bool) : async () {
    alertsMap.add(price, active);
  };

  public shared ({ caller }) func deleteAlert(price : Float) : async () {
    alertsMap.remove(price);
  };

  // 5. Historical Price Tracking
  public query ({ caller }) func getHistoricalPrices() : async [Float] {
    historicalPrices.toArray();
  };
};
