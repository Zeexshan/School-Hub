import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { api } from "@shared/routes";

export function useAnalytics() {
  return useQuery({
    queryKey: [api.analytics.dashboard.path],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}
