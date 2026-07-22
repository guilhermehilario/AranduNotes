import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/index.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita requisições extras ao alternar janelas
      retry: 1, // Limita tentativas de re-execução em caso de falha temporária
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}

export default App;
