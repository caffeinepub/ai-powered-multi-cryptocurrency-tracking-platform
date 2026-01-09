import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MultiCryptoDashboard } from '@/components/MultiCryptoDashboard';

// Configure QueryClient with optimized settings for real-time crypto data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 5000, // Data considered fresh for 5 seconds
      gcTime: 1000 * 60 * 10, // Cache for 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s or rate limits
        if (error instanceof Error) {
          if (error.message.includes('404') || error.message.includes('Rate limit')) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
            <MultiCryptoDashboard />
          </main>
          <Footer />
        </div>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
