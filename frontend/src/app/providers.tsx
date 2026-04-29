import { useEffect, useRef, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary, ToastContainer } from '@shared/ui';
import { toast } from '@shared/lib/toast-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function MutationErrorInterceptor() {
  const queryClient = useQueryClient();
  const handlerRef = useRef<((error: unknown) => void) | null>(null);

  useEffect(() => {
    // Interceptor: cada vez que una mutation falla, mostrar toast
    handlerRef.current = (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Error inesperado en la operación';

      // Limpiar mensaje HTTP genérico
      const cleanMessage = message
        .replace(/^Request failed with status code \d+$/, 'Error de conexión con el servidor')
        .replace(/\[object Object\]/, 'Error en la operación');

      toast.error(cleanMessage);
    };

    // Suscribirse a errores de mutations
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error' && handlerRef.current) {
        handlerRef.current(event.action.error);
      }
    });

    return unsubscribe;
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <MutationErrorInterceptor />
        {children}
        <ToastContainer />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
