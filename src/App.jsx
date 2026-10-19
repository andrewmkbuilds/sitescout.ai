import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ThemeProvider } from '@/lib/theme';
// Add page imports here
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/AppLayout';
import Overview from '@/pages/Overview';
import Discover from '@/pages/Discover';
import Leads from '@/pages/Leads';
import Audits from '@/pages/Audits';
import Outreach from '@/pages/Outreach';
import Agents from '@/pages/Agents';
import Concepts from '@/pages/Concepts';
import Templates from '@/pages/Templates';
import Campaigns from '@/pages/Campaigns';
import Analytics from '@/pages/Analytics';
import Team from '@/pages/Team';
import Integrations from '@/pages/Integrations';
import Settings from '@/pages/Settings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated app routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Overview />} />
          <Route path="/app/discover" element={<Discover />} />
          <Route path="/app/leads" element={<Leads />} />
          <Route path="/app/audits" element={<Audits />} />
          <Route path="/app/outreach" element={<Outreach />} />
          <Route path="/app/agents" element={<Agents />} />
          <Route path="/app/concepts" element={<Concepts />} />
          <Route path="/app/templates" element={<Templates />} />
          <Route path="/app/campaigns" element={<Campaigns />} />
          <Route path="/app/analytics" element={<Analytics />} />
          <Route path="/app/team" element={<Team />} />
          <Route path="/app/integrations" element={<Integrations />} />
          <Route path="/app/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App