module {
  type OldActor = {
    icpPortfolio : { coins : Float; avgCost : Float };
    shortTimeframes : [{ name : Text; intervalMinutes : Nat }];
    longTimeframes : [{ name : Text; intervalMinutes : Nat }];
    chartTimeframes : [{ name : Text; intervalMinutes : Nat }];
  };

  type NewActor = {};

  public func run(_old : OldActor) : NewActor {
    {};
  };
};
