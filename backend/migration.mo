import Map "mo:core/Map";
import List "mo:core/List";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

module {
  type OldAlert = {
    price : Float;
    isTriggered : Bool;
  };

  type OldActor = {
    alerts : Map.Map<Float, Bool>;
    icpPriceHistory : List.List<{
      price : Float;
      timestamp : Int;
    }>;
  };

  type NewActor = {
    alerts : Map.Map<Float, Bool>;
    icpPriceHistory : List.List<{
      price : Float;
      timestamp : Int;
    }>;
    cachedTopCryptos : List.List<{
      id : Text;
      symbol : Text;
      name : Text;
      currentPrice : Float;
      marketCap : ?Float;
      priceChange24h : ?Float;
    }>;
    portfolioGoals : List.List<{
      name : Text;
      target : Float;
      isCompleted : Bool;
    }>;
    userProfiles : Map.Map<Principal, {
      name : Text;
    }>;
  };

  public func run(old : OldActor) : NewActor {
    { 
      old with 
      cachedTopCryptos = List.empty<{
        id : Text;
        symbol : Text;
        name : Text;
        currentPrice : Float;
        marketCap : ?Float;
        priceChange24h : ?Float;
      }>(); 
      portfolioGoals = List.empty<{
        name : Text;
        target : Float;
        isCompleted : Bool;
      }>();
      userProfiles = Map.empty<Principal, {
        name : Text;
      }>();
    };
  };
};
