import { useSession, useToken } from "@/hooks/auth-hooks";
import { browserEnv } from "@/lib/browser-env";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProviderWithAuth } from "convex/react";
import { useMemo } from "react";
import { routeTree } from "./routeTree.gen";
import { convexQueryClient, queryClient } from "./providers";

export function createRouter() {
  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: "intent",
      context: { queryClient },
      defaultNotFoundComponent: () => <div>Not Found</div>,
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
  //   const { data: initialToken } = useQuery({
  //     queryKey: ["auth_token"],
  //   });
  const data = useToken({
    initialData: () => {
      console.log("initialData");
      const token = queryClient.getQueryData(["auth_token"]);
      return token ?? undefined;
    },
  });
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
