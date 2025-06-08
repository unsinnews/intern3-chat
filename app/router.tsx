import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProviderWithAuth } from "convex/react";
import { routeTree } from "./routeTree.gen";
import { useSession, useToken } from "@/hooks/auth-hooks";
import { useMemo } from "react";
import { browserEnv } from "@/convex/lib/env";

export function createRouter() {
  const convexQueryClient = new ConvexQueryClient(
    browserEnv("VITE_CONVEX_URL")
  );

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: "intent",
      context: { queryClient },
      Wrap: ({ children }) => (
        <ConvexProviderWithAuth
          client={convexQueryClient.convexClient}
          useAuth={useBetterAuth}
        >
          {children}
        </ConvexProviderWithAuth>
      ),
    }),
    queryClient
  );

  return router;
}

const useBetterAuth = () => {
  const data = useToken();
  const session = useSession();
  return useMemo(
    () => ({
      isLoading: data.isPending || data.isLoading,
      isAuthenticated: !!session.user?.id,
      fetchAccessToken: async () => data.token ?? null,
    }),
    [data.isPending, data.isLoading, session.user?.id, data.token]
  );
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
