import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Meetings from "./pages/Meetings";
import Tasks from "./pages/Tasks";
import ReviewQueue from "./pages/ReviewQueue";
import GoogleSync from "./pages/GoogleSync";
import Chat from "./pages/Chat";
import Calendar from "./pages/Calendar";
import EmailTracking from "./pages/EmailTracking";
import ApprovalHistory from "./pages/ApprovalHistory";
import MeetingRoom from "./pages/MeetingRoom";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/meetings"} component={Meetings} />
      <Route path={"/meeting-room/:id"} component={MeetingRoom} />
      <Route path={"/tasks"} component={Tasks} />
        <Route path="/review" component={ReviewQueue} />
      <Route path="/google-sync" component={GoogleSync} />
      <Route path="/chat" component={Chat} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/email-tracking" component={EmailTracking} />
      <Route path="/approval-history" component={ApprovalHistory} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
