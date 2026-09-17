import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";

// HR console is only ever used by admins — lazy-load it so merchandisers
// (the vast majority of visitors) never download that code on first load.
const HR = lazy(() => import("./pages/HR"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/hr"} component={HR} />
        <Route path={"/login"} component={SignIn} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}


function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
