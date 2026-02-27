import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-screen-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent/30 to-gold-accent/30 border border-white/10 glow-cyan">
            <Activity className="h-5 w-5 text-cyan-accent" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-cyan-accent to-gold-accent bg-clip-text text-transparent leading-none">
              Crypto Tracker AI
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Top 100 · Live Market Data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Live</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-accent/10 border border-cyan-accent/20 text-cyan-accent text-xs font-medium">
            <span>Auto-refresh 60s</span>
          </div>
        </div>
      </div>
    </header>
  );
}
