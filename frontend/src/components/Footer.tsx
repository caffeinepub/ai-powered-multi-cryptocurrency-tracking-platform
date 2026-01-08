import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 transition-all duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© 2025. Built with</span>
            <Heart className="h-4 w-4 fill-primary text-primary animate-pulse-subtle" />
            <span>using</span>
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors duration-300 hover:underline"
            >
              caffeine.ai
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground">
            <span>Data provided by CoinGecko API</span>
            <span className="hidden sm:inline">•</span>
            <span>Real-time updates every 15 seconds</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
