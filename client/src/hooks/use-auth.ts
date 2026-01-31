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
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
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
      // Save token to localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      queryClient.setQueryData([api.auth.me.path], data.user);
      toast({ title: "Welcome back!", description: `Logged in as ${data.user.name}` });
      
      // Redirect based on role
      switch (data.user.role) {
        case "admin": setLocation("/admin/dashboard"); break;
        case "teacher": setLocation("/teacher/dashboard"); break;
        case "student": setLocation("/student/dashboard"); break;
        case "parent": setLocation("/student/dashboard"); break; // Parents see student view for MVP
        default: setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Clear the token from localStorage
      localStorage.removeItem("token");
      return Promise.resolve(); 
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
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
