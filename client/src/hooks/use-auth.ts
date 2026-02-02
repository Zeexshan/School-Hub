import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest, type InsertUser } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Helper to handle both 401 and success responses for /me
async function fetchMe() {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(api.auth.me.path, { headers });

  // If unauthorized, return null so we know to show the login page
  if (res.status === 401) return null;

  if (!res.ok) {
    // Silently fail on other errors to avoid crashing the app loop
    return null;
  }

  return api.auth.me.responses[200].parse(await res.json());
}

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // Keep user data "fresh" for 5 mins
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }

      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // 1. CRITICAL: Save token FIRST before anything else
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // 2. Manually update the user state so the UI updates immediately
      queryClient.setQueryData([api.auth.me.path], data.user);

      // 3. FORCE REFRESH: Tell all other hooks (Dashboard, Students, etc.) to fetch again
      // This ensures they see the new token and don't return 401
      queryClient.invalidateQueries();

      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });

      // 4. Redirect based on role
      switch (data.user.role) {
        case "admin":
          setLocation("/admin/dashboard");
          break;
        case "teacher":
          setLocation("/teacher/dashboard");
          break;
        case "student":
          setLocation("/student/dashboard");
          break;
        case "parent":
          setLocation("/student/dashboard");
          break;
        default:
          setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("token");
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      // Clear all cached data (analytics, students, etc) so next login is fresh
      queryClient.clear();
      setLocation("/auth/login");
      toast({ title: "Logged out", description: "See you next time!" });
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
