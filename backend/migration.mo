module {
  type OldActor = {
    cacheDurationNs : Nat;
  };

  type NewActor = {
    cacheDurationInt : Nat;
    cacheDurationNat : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      cacheDurationInt = old.cacheDurationNs;
      cacheDurationNat = old.cacheDurationNs;
    };
  };
};
