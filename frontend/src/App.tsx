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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BarChart3, Target, Lightbulb, LineChart } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 25000,
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen flex-col bg-background">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-4 py-8">
              <Tabs defaultValue="tracker" className="space-y-8">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="tracker" className="gap-2">
                    <LineChart className="h-4 w-4" />
                    <span className="hidden sm:inline">ICP Tracker</span>
                    <span className="sm:hidden">Tracker</span>
                  </TabsTrigger>
                  <TabsTrigger value="simulator" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Simulator</span>
                    <span className="sm:hidden">Sim</span>
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">Recommendations</span>
                    <span className="sm:hidden">Rec</span>
                  </TabsTrigger>
                  <TabsTrigger value="planner" className="gap-2">
                    <Target className="h-4 w-4" />
                    <span className="hidden sm:inline">Planner</span>
                    <span className="sm:hidden">Plan</span>
                  </TabsTrigger>
                  <TabsTrigger value="market" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Top 100</span>
                    <span className="sm:hidden">Top 100</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tracker" className="space-y-12">
                  <ICPTracker />
                </TabsContent>

                <TabsContent value="simulator" className="space-y-12">
                  <PortfolioSimulator />
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-12">
                  <InvestmentRecommendations />
                </TabsContent>

                <TabsContent value="planner" className="space-y-12">
                  <InvestmentPlanner />
                </TabsContent>

                <TabsContent value="market" className="space-y-12">
                  <Top100Dashboard />
                </TabsContent>
              </Tabs>
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
