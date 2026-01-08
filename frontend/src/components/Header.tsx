import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Menu, Search, X, LineChart, BarChart3, Target, Lightbulb, TrendingUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Section = 'tracker' | 'simulator' | 'recommendations' | 'planner' | 'market';

interface HeaderProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const sections = [
  { id: 'tracker' as Section, label: 'ICP Tracker', icon: LineChart, description: 'Real-time price monitoring' },
  { id: 'simulator' as Section, label: 'Portfolio Simulator', icon: TrendingUpIcon, description: 'Growth projections' },
  { id: 'recommendations' as Section, label: 'Recommendations', icon: Lightbulb, description: 'AI-powered insights' },
  { id: 'planner' as Section, label: 'Investment Planner', icon: Target, description: 'Portfolio allocation' },
  { id: 'market' as Section, label: 'Top 100 Market', icon: BarChart3, description: 'Live market data' },
];

export function Header({ activeSection, onSectionChange }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredSections = sections.filter(section =>
    section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSectionChange = (section: Section) => {
    onSectionChange(section);
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
  };

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
              CryptoInvest
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Investment & Growth Platform</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2" role="navigation" aria-label="Main navigation">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <Button
                key={section.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSectionChange(section.id)}
                className={`gap-2 transition-all duration-300 ${
                  isActive 
                    ? 'shadow-md shadow-primary/20' 
                    : 'hover:bg-accent/50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xl:inline">{section.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Search and Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Search Popover - Desktop */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex gap-2 transition-all duration-300 hover:shadow-md"
                aria-label="Search navigation"
              >
                <Search className="h-4 w-4" />
                <span className="text-muted-foreground">Search...</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput 
                  placeholder="Search sections..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No sections found.</CommandEmpty>
                  <CommandGroup heading="Navigation">
                    {filteredSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <CommandItem
                          key={section.id}
                          onSelect={() => handleSectionChange(section.id)}
                          className="cursor-pointer"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{section.label}</span>
                            <span className="text-xs text-muted-foreground">{section.description}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="lg:hidden transition-all duration-300"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search sections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Mobile Navigation Items */}
                <nav className="space-y-2" role="navigation" aria-label="Mobile navigation">
                  {filteredSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <Button
                        key={section.id}
                        variant={isActive ? 'default' : 'ghost'}
                        className="w-full justify-start gap-3 transition-all duration-300"
                        onClick={() => handleSectionChange(section.id)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{section.label}</span>
                          <span className="text-xs text-muted-foreground">{section.description}</span>
                        </div>
                      </Button>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
