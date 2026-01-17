import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Bot, Calendar, CheckSquare, FileText, Users } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="container py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">AI Secretary Agent</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">Welcome, {user?.name || user?.email}</span>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </nav>

        <main className="container py-12">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your AI-Powered Personal Secretary
            </h2>
            <p className="text-lg text-foreground">
              Streamline your organizational tasks with intelligent meeting management, 
              task tracking, and automated communications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Link href="/chat">
              <div className="p-6 border border-border rounded-lg bg-card hover:shadow-lg transition-shadow cursor-pointer">
                <Bot className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">AI Chat Assistant</h3>
                <p className="text-foreground">
                  Ask questions, get status updates, and manage tasks through natural conversation.
                </p>
              </div>
            </Link>

            <Link href="/meetings">
              <div className="p-6 border border-border rounded-lg bg-card hover:shadow-lg transition-shadow cursor-pointer">
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Meeting Management</h3>
                <p className="text-foreground">
                  Capture minutes, extract action items, and generate summaries automatically.
                </p>
              </div>
            </Link>

            <Link href="/tasks">
              <div className="p-6 border border-border rounded-lg bg-card hover:shadow-lg transition-shadow cursor-pointer">
                <CheckSquare className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Task Tracking</h3>
                <p className="text-foreground">
                  Monitor progress, track deadlines, and prioritize tasks by urgency.
                </p>
              </div>
            </Link>

            <Link href="/review">
              <div className="p-6 border border-border rounded-lg bg-card hover:shadow-lg transition-shadow cursor-pointer">
                <FileText className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Review & Approve</h3>
                <p className="text-foreground">
                  Human-in-the-loop workflow for reviewing summaries and communications.
                </p>
              </div>
            </Link>

            <Link href="/dashboard">
              <div className="p-6 border border-border rounded-lg bg-card hover:shadow-lg transition-shadow cursor-pointer">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Team Dashboard</h3>
                <p className="text-foreground">
                  Overview of all activities, priorities, and pending items.
                </p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">AI Secretary Agent</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </nav>

      <main className="container py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            AI-Powered Personal Secretary
          </h2>
          <p className="text-xl text-foreground mb-8">
            Streamline meeting management, task tracking, and team communications 
            with intelligent automation and human oversight.
          </p>
          <Button size="lg" asChild>
            <a href={getLoginUrl()}>Get Started</a>
          </Button>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Smart Meeting Management</h3>
            <p className="text-foreground">
              Automatically capture minutes, extract action items, and assign owners with AI assistance.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Intelligent Task Tracking</h3>
            <p className="text-foreground">
              Monitor progress, detect overdue items, and escalate appropriately within hierarchy.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Human-in-the-Loop Review</h3>
            <p className="text-foreground">
              Review and approve all AI-generated content before distribution to maintain quality.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
