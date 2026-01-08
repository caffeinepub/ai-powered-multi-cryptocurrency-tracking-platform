import Map "mo:core/Map";
import Float "mo:core/Float";
import List "mo:core/List";
import Int "mo:core/Int";

module {
  type ICPPortfolio = {
    coins : Float;
    avgCost : Float;
  };

  type PriceCache = {
    price : Float;
    timestamp : Int;
  };

  type OldActor = {
    alerts : Map.Map<Float, Bool>;
    icpPriceHistory : List.List<PriceCache>;
    icpPortfolio : ICPPortfolio;
  };

  type NewActor = {
    alerts : Map.Map<Float, Bool>;
    icpPriceHistory : List.List<PriceCache>;
    icpPortfolio : ICPPortfolio;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
