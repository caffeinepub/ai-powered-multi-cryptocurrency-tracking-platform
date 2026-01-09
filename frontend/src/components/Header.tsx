import { TrendingUp, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent shadow-lg shadow-primary/20 transition-transform duration-300 hover:scale-105">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Crypto Tracker AI
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Multi-Crypto Analytics</p>
          </div>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="gap-2 transition-all duration-300 hover:shadow-md"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
