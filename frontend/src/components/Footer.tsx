import { Heart } from 'lucide-react';

export function Footer() {
  const appId = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'crypto-tracker-ai'
  );

  return (
    <footer className="border-t border-white/10 bg-background/80 backdrop-blur-xl mt-8">
      <div className="container mx-auto px-4 py-6 max-w-screen-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} Crypto Tracker AI. Built with</span>
            <Heart className="h-3.5 w-3.5 fill-cyan-accent text-cyan-accent" />
            <span>using</span>
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-cyan-accent hover:underline"
            >
              caffeine.ai
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span>Data: CoinGecko API</span>
            <span className="text-white/20">·</span>
            <span>Auto-refresh: 60s</span>
            <span className="text-white/20">·</span>
            <span>Not financial advice</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
