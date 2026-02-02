import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { api } from "@shared/routes";

export function useAnalytics() {
  return useQuery({
    // We use the path from your shared routes as the key
    queryKey: [api.analytics.dashboard.path],
    // We use the central getQueryFn which automatically adds the JWT token
    queryFn: getQueryFn({ on401: "throw" }),
  });
}
