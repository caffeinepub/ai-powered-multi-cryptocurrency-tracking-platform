import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import OutCall "http-outcalls/outcall";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Authorization Mixin
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Alerts = Map.Map<Float, Bool>;
  let cacheDurationInt = 24 * 60 * 60 * 1_000_000_000;
  let cacheDurationNat : Nat = 24 * 60 * 60 * 1_000_000_000;

  public type PriceRange = {
    low : Float;
    high : Float;
  };

  type CoinBase = {
    id : Text;
    symbol : Text;
    name : Text;
    marketCap : ?Float;
    priceChange24h : ?Float;
  };

  type Coin = CoinBase and {
    currentPrice : Float;
  };

  type PriceCache = {
    price : Float;
    timestamp : Int;
  };

  type ChartPriceCache = PriceCache and {
    open : Float;
    high : Float;
    low : Float;
    close : Float;
  };

  public type PortfolioSummary = {
    coins : Float;
    avgCost : Float;
    currentValue : Float;
    profitLossDollar : Float;
    profitLossPercent : Float;
  };

  // Alert system
  let alerts : Alerts = Map.empty<Float, Bool>();
  let icpPriceHistory = List.empty<PriceCache>();

  // Indicator types
  public type Indicator = {
    #none;
    #rsi;
    #macd;
    #ttmSqueeze;
  };

  // Chart type
  public type ChartType = {
    #line;
    #candlestick;
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getICPLivePrice() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access live price data");
    };

    let url = "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public query ({ caller }) func getAlerts() : async [(Float, Bool)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access alerts");
    };
    alerts.toArray();
  };

  public shared ({ caller }) func createPriceAlert(price : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create price alerts");
    };
    alerts.add(price, false);
  };

  public shared ({ caller }) func deletePriceAlert(price : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete price alerts");
    };
    if (alerts.containsKey(price)) {
      alerts.remove(price);
      ();
    } else {
      Runtime.trap("Price alert not found");
    };
  };

  public shared ({ caller }) func toggleAlertStatus(price : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle alert status");
    };
    let currentStatus = switch (alerts.get(price)) {
      case (?status) { not status };
      case (null) { true };
    };
    alerts.add(price, currentStatus);
  };

  public query ({ caller }) func getCachedPriceHistory() : async [PriceCache] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access price history");
    };
    let currentTime = Time.now();
    let filtered = icpPriceHistory.filter(func(entry) { currentTime - entry.timestamp <= cacheDurationInt });
    filtered.toArray();
  };

  public shared ({ caller }) func recordNewICPPrice(price : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record prices");
    };
    let newEntry = {
      price;
      timestamp = Time.now() : Int;
    };

    let currentTimeInt = Time.now() : Int;
    let currentTimeNat = Int.abs(currentTimeInt);
    let filtered = icpPriceHistory.filter(
      func(entry) {
        Int.abs(currentTimeInt - entry.timestamp) <= cacheDurationNat
      }
    );

    icpPriceHistory.clear();
    icpPriceHistory.addAll(filtered.values());
    icpPriceHistory.add(newEntry);
  };

  public type Timeframe = {
    name : Text; // 1m, 2m, 3m, 5m, 10m, 15m, 30m, 1h, 2h, 4h, 6h, 1d, 1mo, 1q, 1y
    intervalMinutes : Nat;
  };

  func getMinutesForTimeframe(name : Text) : Nat {
    switch (name) {
      case ("m") { 1 };
      case ("2m") { 2 };
      case ("3m") { 3 };
      case ("5m") { 5 };
      case ("10m") { 10 };
      case ("15m") { 15 };
      case ("30m") { 30 };
      case ("1h") { 60 };
      case ("2h") { 120 };
      case ("4h") { 240 };
      case ("6h") { 360 };
      case ("1d") { 1440 };
      case ("1mo") { 43200 };
      case ("1q") { 129600 };
      case ("1y") { 525600 };
      case (_) { 1 };
    };
  };

  public type TimeframeParams = {
    intervalNanos : Int;
    timeframe : Text;
    priceData : [PriceCache];
  };

  func findClosestEntry(array : [PriceCache], time : Int) : ?PriceCache {
    let filtered = array.filter(
      func(entry) {
        Int.abs(entry.timestamp - time) <= 60 * 1_000_000_000; // 1 minute in nanos
      }
    );
    switch (filtered.size()) {
      case (0) { null };
      case (_) { ?filtered[0] };
    };
  };

  func getRelativePosition(_timestamp : Int, array : [PriceCache]) : {
    left : ?PriceCache;
    right : ?PriceCache;
    ratio : Float;
  } {
    if (array.size() == 0 or array.size() == 1) {
      return { left = null; right = null; ratio = 0.0 };
    };
    let start = array[0].timestamp.toFloat();
    let end = array[array.size() - 1].timestamp.toFloat();
    let totalRange = end - start;
    let positionInRange = (_timestamp.toFloat() - start);
    let ratio = if (totalRange > 0.0) {
      positionInRange / totalRange;
    } else {
      0.0;
    };

    var left : ?PriceCache = null;
    var right : ?PriceCache = null;

    for (entry in array.values()) {
      if (_timestamp >= entry.timestamp) { left := ?entry };
      if (_timestamp <= entry.timestamp) {
        right := ?entry;
        Runtime.trap("Unexpected right timestamp.");
      };
    };
    { left; right; ratio };
  };

  func roundDownDay(timestamp : Int) : Int {
    let dayInNanos : Int = 60 * 60 * 24 * 1_000_000_000;
    dayInNanos * (timestamp / dayInNanos);
  };

  public query ({ caller }) func getDailyHighLowFromCache() : async PriceRange {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access daily high/low data");
    };
    var high : Float = 0.0;
    var low : Float = 0.0;

    switch (icpPriceHistory.last()) {
      case (?lastCacheEntry) {
        high := lastCacheEntry.price;
        low := lastCacheEntry.price;
      };
      case (null) {};
    };

    let today = roundDownDay(Time.now());

    for (entry in icpPriceHistory.values()) {
      if (roundDownDay(entry.timestamp) == today) {
        if (entry.price > high) { high := entry.price };
        if (entry.price < low) { low := entry.price };
      };
    };

    { high; low };
  };

  public shared ({ caller }) func getHistoricalPriceHistory(params : TimeframeParams) : async [PriceCache] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access historical price data");
    };
    let intervalNs = params.intervalNanos;
    let now = Time.now();

    // 1. Filter recent data.
    let recentHistory = params.priceData.filter(
      func(entry) {
        (now - entry.timestamp).toFloat() <= cacheDurationInt.toFloat();
      }
    );

    if (recentHistory.size() == 0) { return [] };

    // Use array for better access.
    let array = recentHistory;

    // 2. Map exact (aligned) entries to new array.
    let mappedAligned = array.map(
      func(entry) {
        {
          price = entry.price;
          timestamp = entry.timestamp;
        };
      }
    );

    // 3. Interpolate missing entries (not aligned).
    let final = mappedAligned.map(
      func(entry) {
        // Try direct match.
        switch (findClosestEntry(array, entry.timestamp)) {
          case (?closest) {
            let delta = Int.abs(closest.timestamp - entry.timestamp);
            if (delta <= 60 * 1_000_000_000) // 1 minute in nanos
            {
              return {
                price = closest.price;
                timestamp = entry.timestamp;
              };
            };
          };
          case (null) {};
        };

        // If no direct match, interpolate.
        let { left; right; ratio } = getRelativePosition(entry.timestamp, array);

        switch (left, right) {
          case (?l, ?r) {
            let interpPrice = l.price * (1.0 - ratio) + r.price * ratio;
            {
              price = interpPrice;
              timestamp = entry.timestamp;
            };
          };
          case (?l, null) { l };
          case (null, ?r) { r };
          case (null, null) {
            { entry with price = 0.0 };
          };
        };
      }
    );

    final;
  };

  public shared ({ caller }) func getResampledPriceHistory(intervalNanos : Nat) : async [PriceCache] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access resampled price history");
    };
    let intervalNs = intervalNanos.toInt();
    let now = Time.now();
    let recentHistory = icpPriceHistory.filter(
      func(entry) {
        Int.abs(now - entry.timestamp) <= cacheDurationNat
      }
    ).toArray();
    if (recentHistory.size() == 0) { return [] };

    let grouped = List.empty<List.List<PriceCache>>();
    var currentGroup = List.empty<PriceCache>();
    var groupStartTime : ?Int = null;

    for (entry in recentHistory.values()) {
      switch (groupStartTime) {
        case (?startTime) {
          if (Int.abs(entry.timestamp - startTime) <= cacheDurationNat) {
            currentGroup.add(entry);
          } else {
            grouped.add(currentGroup);
            currentGroup := List.empty<PriceCache>();
            currentGroup.add(entry);
            groupStartTime := ?entry.timestamp;
          };
        };
        case (null) {
          currentGroup.add(entry);
          groupStartTime := ?entry.timestamp;
        };
      };
    };

    if (currentGroup.size() > 0) {
      grouped.add(currentGroup);
    };

    let resampled = grouped.toArray().map(func(group) {
      let groupArray = group.toArray();
      if (groupArray.size() == 0) { return null };
      let sum = groupArray.foldLeft(0.0, func(acc, entry) { acc + entry.price });
      let avg = sum / groupArray.size().toFloat();
      ?{ price = avg; timestamp = groupArray[0].timestamp };
    });

    resampled.filterMap(func(x) { x });
  };

  public shared ({ caller }) func getHistoricalDataRange() : async {
    start : Int;
    end : Int;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access historical data range");
    };
    let entries = icpPriceHistory.toArray();
    if (entries.size() == 0) {
      { start = 0; end = 0 };
    } else {
      var min = entries[0].timestamp;
      var max = entries[0].timestamp;
      let entriesIter = entries.values();

      for (entry in entriesIter) {
        if (entry.timestamp < min) { min := entry.timestamp };
        if (entry.timestamp > max) { max := entry.timestamp };
      };
      { start = min; end = max };
    };
  };

  // Portfolio summary
  public query ({ caller }) func getPortfolioSummary() : async PortfolioSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access portfolio summary");
    };

    let coins = 1864.0;
    let avgCost = 6.152;
    let icpPrice = switch (icpPriceHistory.last()) {
      case (?latest) { latest.price };
      case (null) { 0.0 };
    };

    let currentValue = coins * icpPrice;
    let originalInvestment = coins * avgCost;
    let profitLossDollar = currentValue - originalInvestment;
    let profitLossPercent = if (originalInvestment > 0) {
      (profitLossDollar) / originalInvestment * 100.0;
    } else {
      0.0;
    };

    {
      coins;
      avgCost;
      currentValue;
      profitLossDollar;
      profitLossPercent;
    };
  };

  // Top cryptos functions - public market data, no auth required
  let cachedTopCryptos = List.empty<Coin>();

  func trimCacheToMaxDays(days : Nat) : () {
    if (cachedTopCryptos.size() > days) {
      let iter = cachedTopCryptos.values();
      cachedTopCryptos.clear();
      cachedTopCryptos.addAll(iter.take(days));
    };
  };

  public query ({ caller }) func getCachedTopCryptos() : async [Coin] {
    // Public market data - no authorization required
    cachedTopCryptos.toArray();
  };

  public shared ({ caller }) func addTopCryptosToCache(newTopCryptos : [Coin]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update crypto cache");
    };
    cachedTopCryptos.clear();
    for (newCoin in newTopCryptos.values()) {
      cachedTopCryptos.add(newCoin);
    };
    trimCacheToMaxDays(30);
  };

  type PortfolioGoal = {
    name : Text;
    target : Float;
    isCompleted : Bool;
  };

  let portfolioGoals = List.empty<PortfolioGoal>();

  public query ({ caller }) func getPortfolioGoals() : async [PortfolioGoal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access portfolio goals");
    };
    portfolioGoals.toArray();
  };

  public shared ({ caller }) func savePortfolioGoals(goals : [PortfolioGoal]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save portfolio goals");
    };

    portfolioGoals.clear();
    for (goal in goals.values()) {
      portfolioGoals.add(goal);
    };
  };

  // User profile management as required by instructions
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user: Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };
};
