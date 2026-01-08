import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldPortfolioSummary = {
    coins : Float;
    avgCost : Float;
  };

  type OldActor = {
    portfolioSummary : OldPortfolioSummary;
    alerts : Map.Map<Float, Bool>;
  };

  type NewICPPortfolio = {
    coins : Float;
    avgCost : Float;
  };

  type NewActor = {
    icpPortfolio : NewICPPortfolio;
    alerts : Map.Map<Float, Bool>;
  };

  public func run(old : OldActor) : NewActor {
    let icpPortfolio : NewICPPortfolio = {
      coins = old.portfolioSummary.coins;
      avgCost = old.portfolioSummary.avgCost;
    };
    { icpPortfolio; alerts = old.alerts };
  };
};
