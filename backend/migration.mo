import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type OldActor = {
    alerts : Map.Map<Float, Bool>;
    icpPriceHistory : List.List<{
      price : Float;
      timestamp : Int;
    }>;
    portfolioGoals : List.List<{
      name : Text;
      target : Float;
      isCompleted : Bool;
    }>;
  };

  type NewActor = {
    // Only persistent fields of the new actor go here.
    userAlerts : Map.Map<Principal, Map.Map<Float, Bool>>;
    icpPriceHistory : List.List<{
      price : Float;
      timestamp : Int;
    }>;
    userPortfolioGoals : Map.Map<Principal, List.List<{
      name : Text;
      target : Float;
      isCompleted : Bool;
    }>>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      userAlerts = Map.empty<Principal, Map.Map<Float, Bool>>();
      userPortfolioGoals = Map.empty<Principal, List.List<{
        name : Text;
        target : Float;
        isCompleted : Bool;
      }>>();
    };
  };
};

