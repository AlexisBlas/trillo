import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { router } from './router';
import { useIsMobile } from './hooks/useIsMobile';
import { isAppEmbed } from './lib/embed';
import { LandingPage } from './pages/LandingPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const isAdminPath = () =>
  typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

export default function App() {
  const isMobile = useIsMobile();

  if (!isMobile && !isAdminPath() && !isAppEmbed()) {
    return (
      <ThemeProvider>
        <LangProvider>
          <LandingPage />
        </LangProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LangProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
