import type { ComponentType } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';

import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import UsersList from '@/pages/users';
import UserDetail from '@/pages/user-detail';
import Profile from '@/pages/profile';
import Messages from '@/pages/messages';
import { Layout } from '@/components/layout';
import { Loader2 } from 'lucide-react';
import 'dotenv/config';

const queryClient = new QueryClient();

function hasToken() {
  return !!localStorage.getItem("token");
}

// Auth Guard Wrapper
function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const token = hasToken();
  const { data: user, isLoading, isError } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false, enabled: token }
  });

  if (!token) {
    return <Redirect to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isError || !user) {
    localStorage.removeItem("token");
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

// Public Route Guard (redirects to dashboard if already logged in)
function PublicRoute({ component: Component }: { component: ComponentType }) {
  const token = hasToken();
  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false, enabled: token, staleTime: 1000 * 60 * 5 }
  });

  if (token && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (token && user) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersList} />} />
      <Route path="/users/:id" component={() => <ProtectedRoute component={UserDetail} />} />
      <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;