import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SecurityProvider } from "./contexts/SecurityContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import LockScreen from "./components/LockScreen";
import { SplashScreen } from "./components/SplashScreen";
import Home from "./pages/Home";
import { WorkspaceSetup } from "./pages/WorkspaceSetup";
import { AcceptInvite } from "./pages/AcceptInvite";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/setup"} component={WorkspaceSetup} />
      <Route path={"/accept-invite"} component={AcceptInvite} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first load or after a long absence (e.g., PWA launch)
    const lastVisit = sessionStorage.getItem('lastVisit');
    const now = Date.now();
    if (!lastVisit) {
      sessionStorage.setItem('lastVisit', now.toString());
      return true;
    }
    // Show splash if more than 30 minutes since last visit
    const timeSinceLastVisit = now - parseInt(lastVisit, 10);
    sessionStorage.setItem('lastVisit', now.toString());
    return timeSinceLastVisit > 30 * 60 * 1000;
  });

  return (
    <ErrorBoundary>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} minDuration={1800} />
      )}
      <SecurityProvider>
        <ThemeProvider
          defaultTheme="light"
          switchable
        >
          <WorkspaceProvider>
            <TooltipProvider>
              <Toaster />
              <LockScreen />
              <Router />
            </TooltipProvider>
          </WorkspaceProvider>
        </ThemeProvider>
      </SecurityProvider>
    </ErrorBoundary>
  );
}

export default App;
