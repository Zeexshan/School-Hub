import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import LoginPage from "@/pages/auth/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AttendancePage from "@/pages/teacher/attendance";
import NotFound from "@/pages/not-found";

// Protected Route Component
function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If logged in but wrong role, redirect to their dashboard
    if (user.role === 'admin') return <Redirect to="/admin/dashboard" />;
    if (user.role === 'teacher') return <Redirect to="/teacher/dashboard" />;
    return <Redirect to="/student/dashboard" />;
  }

  return <Component />;
}

// Redirect root to dashboard based on role or login
function RootRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (!user) return <Redirect to="/auth/login" />;
  
  switch(user.role) {
    case "admin": return <Redirect to="/admin/dashboard" />;
    case "teacher": return <Redirect to="/teacher/dashboard" />;
    default: return <Redirect to="/student/dashboard" />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/auth/login" component={LoginPage} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} allowedRoles={['admin']} />
      </Route>
      
      {/* Teacher Routes */}
      <Route path="/teacher/dashboard">
        {/* Placeholder for teacher dashboard, reusing attendance for MVP if needed or redirecting */}
        <ProtectedRoute component={AttendancePage} allowedRoles={['teacher']} />
      </Route>
      <Route path="/teacher/attendance">
        <ProtectedRoute component={AttendancePage} allowedRoles={['teacher']} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
