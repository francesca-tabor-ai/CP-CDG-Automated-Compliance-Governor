import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import GovernanceRules from "./pages/GovernanceRules";
import CodeGeneration from "./pages/CodeGeneration";
import Pipeline from "./pages/Pipeline";
import Evaluation from "./pages/Evaluation";
import ContextStore from "./pages/ContextStore";
import AuditTrail from "./pages/AuditTrail";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/governance-rules"} component={GovernanceRules} />
      <Route path={"/code-generation"} component={CodeGeneration} />
      <Route path={"/pipeline"} component={Pipeline} />
      <Route path={"/evaluation"} component={Evaluation} />
      <Route path={"/context-store"} component={ContextStore} />
      <Route path={"/audit-trail"} component={AuditTrail} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
