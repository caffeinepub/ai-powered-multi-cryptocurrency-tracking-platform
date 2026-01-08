import Map "mo:core/Map";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import List "mo:core/List";

module {
  type AlertStatus = {
    price : Float;
    isActive : Bool;
  };

  type OldActor = {
    alerts : Map.Map<Float, Bool>;
    icpPortfolio : { coins : Float; avgCost : Float };
  };

  type NewActor = {
    alertsMap : Map.Map<Float, Bool>;
    icpPortfolio : { coins : Float; avgCost : Float };
    historicalPrices : List.List<Float>;
    timestamps : List.List<Nat>;
  };

  public func run(old : OldActor) : NewActor {
    {
      alertsMap = old.alerts;
      icpPortfolio = old.icpPortfolio;
      historicalPrices = List.empty<Float>();
      timestamps = List.empty<Nat>();
    };
  };
};
