import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Top100Dashboard } from '@/components/Top100Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 60000,
      gcTime: 1000 * 60 * 15,
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          if (error.message.includes('429') || error.message.includes('Rate limit')) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Header />
          <main className="flex-1">
            <Top100Dashboard />
          </main>
          <Footer />
        </div>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
