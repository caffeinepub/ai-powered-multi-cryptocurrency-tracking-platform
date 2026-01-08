import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ICPTracker } from '@/components/ICPTracker';
import { Top100Dashboard } from '@/components/Top100Dashboard';
import { PortfolioSimulator } from '@/components/PortfolioSimulator';
import { InvestmentRecommendations } from '@/components/InvestmentRecommendations';
import { InvestmentPlanner } from '@/components/InvestmentPlanner';
import { useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 25000,
    },
  },
});

type Section = 'tracker' | 'simulator' | 'recommendations' | 'planner' | 'market';

function App() {
  const [activeSection, setActiveSection] = useState<Section>('tracker');

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen flex-col bg-background">
          <Header activeSection={activeSection} onSectionChange={setActiveSection} />
          <main className="flex-1 animate-fade-in">
            <div className="container mx-auto px-4 py-8 md:py-12">
              <div className="space-y-12">
                {activeSection === 'tracker' && <ICPTracker />}
                {activeSection === 'simulator' && <PortfolioSimulator />}
                {activeSection === 'recommendations' && <InvestmentRecommendations />}
                {activeSection === 'planner' && <InvestmentPlanner />}
                {activeSection === 'market' && <Top100Dashboard />}
              </div>
            </div>
          </main>
          <Footer />
          <Toaster />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
