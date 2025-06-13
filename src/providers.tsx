import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { authClient } from "@/lib/auth-client";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { browserEnv } from "./lib/browser-env";

export const convexQueryClient = new ConvexQueryClient(
  browserEnv("VITE_CONVEX_URL")
);

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

export function Providers({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    queryClient.setQueryData(["auth_token"], initialToken);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryProvider>
        <ThemeProvider>
          <AuthUIProviderTanstack
            authClient={authClient}
            navigate={(href) => router.navigate({ href })}
            replace={(href) => router.navigate({ href, replace: true })}
            Link={({ href, ...props }) => <Link to={href} {...props} />}
          >
            {children}

            <Toaster />
          </AuthUIProviderTanstack>
        </ThemeProvider>
      </AuthQueryProvider>
    </QueryClientProvider>
  );
}
