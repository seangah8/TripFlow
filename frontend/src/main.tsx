import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'

// QueryClient holds the actual cache that every useQuery call (like
// usePlaces) reads from and writes to. One instance for the whole app,
// created outside the component tree so it survives re-renders.
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Makes queryClient available to any useQuery/useMutation call
        anywhere below via React context — this is what usePlaces relies on. */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
