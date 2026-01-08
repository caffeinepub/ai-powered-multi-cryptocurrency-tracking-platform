import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ICPDashboard } from '@/components/ICPDashboard';

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
          <main className="flex-1 animate-fade-in">
            <div className="container mx-auto px-4 py-8 md:py-12">
              <ICPDashboard />
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
