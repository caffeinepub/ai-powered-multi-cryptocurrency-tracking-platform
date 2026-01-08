import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

actor {
  type PriceAlertStatus = {
    price : Float;
    isTriggered : Bool;
  };

  type PortfolioSummary = {
    coins : Float;
    avgCost : Float;
  };

  let portfolioSummary : PortfolioSummary = {
    coins = 1864.0;
    avgCost = 6.152;
  };

  let alerts = Map.empty<Float, Bool>();

  public shared ({ caller }) func toggleAlertStatus(price : Float) : async () {
    let isTriggered = switch (alerts.get(price)) {
      case (?currentStatus) { not currentStatus };
      case (null) { true };
    };
    alerts.add(price, isTriggered);
  };

  public query ({ caller }) func getPortfolioSummary() : async PortfolioSummary {
    portfolioSummary;
  };

  public query ({ caller }) func getAlerts() : async [PriceAlertStatus] {
    alerts.entries().map(func((price, isTriggered)) { { price; isTriggered } }).toArray();
  };
};
