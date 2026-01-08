import List "mo:core/List";
import Map "mo:core/Map";
import Float "mo:core/Float";

module {
  type OldAlerts = Map.Map<Float, Bool>;
  type OldICPPortfolio = {
    coins : Float;
    avgCost : Float;
  };

  type OldActor = {
    icpPortfolio : OldICPPortfolio;
    alerts : OldAlerts;
  };

  type PriceCache = {
    price : Float;
    timestamp : Int;
  };

  type NewAlerts = Map.Map<Float, Bool>;
  type NewICPPortfolio = {
    coins : Float;
    avgCost : Float;
  };

  type NewActor = {
    icpPortfolio : NewICPPortfolio;
    alerts : NewAlerts;
    icpPriceHistory : List.List<PriceCache>;
  };

  public func run(old : OldActor) : NewActor {
    { old with icpPriceHistory = List.empty<PriceCache>() };
  };
};

