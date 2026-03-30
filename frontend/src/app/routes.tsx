import { createBrowserRouter, Navigate } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { ClaimVerifier } from "./pages/ClaimVerifier";
import { URLAnalyzer } from "./pages/URLAnalyzer";
import { CommunityReports } from "./pages/CommunityReports";
import { Search } from "./pages/Search";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Layout } from "./components/Layout";
import { NotFound } from "./pages/NotFound";
import { IntelligenceHub } from "./pages/IntelligenceHub";
import { AuthGuard } from "./components/AuthGuard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      // Root redirects to login so fresh visits always start at login
      { index: true, element: <Navigate to="/login" replace /> },
      // Public pages
      { path: "landing", Component: LandingPage },
      { path: "search", Component: Search },
      // Auth pages
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      // Protected pages — require valid (non-expired) JWT
      { path: "verify", element: <AuthGuard><ClaimVerifier /></AuthGuard> },
      { path: "analyze-url", element: <AuthGuard><URLAnalyzer /></AuthGuard> },
      { path: "community", element: <AuthGuard><CommunityReports /></AuthGuard> },
      { path: "dashboard", element: <AuthGuard><Dashboard /></AuthGuard> },
      { path: "intelligence-hub", element: <AuthGuard><IntelligenceHub /></AuthGuard> },
      { path: "*", Component: NotFound },
    ],
  },
]);
