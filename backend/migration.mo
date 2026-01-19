import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  public type OldBackend = {
    icpPriceHistory : List.List<{ price : Float; timestamp : Int }>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    // ... other original state
  };

  public type NewBackend = {
    icpPriceHistory : List.List<{ price : Float; timestamp : Int }>;
    uniPriceHistory : List.List<{ price : Float; timestamp : Int }>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    // ... other new state
  };

  public func run(old : OldBackend) : NewBackend {
    { old with uniPriceHistory = List.empty<{ price : Float; timestamp : Int }>() };
  };
};
