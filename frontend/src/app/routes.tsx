import { createBrowserRouter } from "react-router";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: LandingPage },
      { path: "verify", Component: ClaimVerifier },
      { path: "analyze-url", Component: URLAnalyzer },
      { path: "community", Component: CommunityReports },
      { path: "search", Component: Search },
      { path: "dashboard", Component: Dashboard },
      { path: "intelligence-hub", Component: IntelligenceHub },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "*", Component: NotFound },
    ],
  },
]);
