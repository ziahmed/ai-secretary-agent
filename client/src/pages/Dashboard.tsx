import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckSquare, AlertCircle, Clock, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  const { data: meetings, isLoading: meetingsLoading } = trpc.meetings.list.useQuery();
  const { data: overdueTasks } = trpc.tasks.getOverdue.useQuery();
  const { data: reviewItems } = trpc.review.getPending.useQuery();
  
  const generateRemindersMutation = trpc.tasks.generateReminders.useMutation({
    onSuccess: (data) => {
      utils.review.getPending.invalidate();
      if (data.remindersGenerated > 0) {
        toast.success(`Generated ${data.remindersGenerated} reminder(s)`);
      } else {
        toast.info("No tasks need reminders at this time");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate reminders");
    },
  });

  const openTasks = tasks?.filter(t => t.status === 'open' || t.status === 'in_progress') || [];
  const upcomingMeetings = meetings?.filter(m => m.status === 'scheduled') || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-foreground mt-2">Overview of your tasks, meetings, and pending reviews</p>
          </div>
          <Button
            onClick={() => generateRemindersMutation.mutate()}
            disabled={generateRemindersMutation.isPending}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            {generateRemindersMutation.isPending ? "Generating..." : "Generate Reminders"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setLocation('/tasks')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Open Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{openTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                Active tasks in progress
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setLocation('/tasks')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueTasks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Tasks past deadline
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setLocation('/meetings')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Upcoming Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{upcomingMeetings.length}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled meetings
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setLocation('/review')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{reviewItems?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Items awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Recent Tasks</CardTitle>
              <CardDescription className="text-foreground">Your most recent task updates</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <p className="text-foreground">Loading tasks...</p>
              ) : openTasks.length === 0 ? (
                <p className="text-muted-foreground">No open tasks</p>
              ) : (
                <div className="space-y-4">
                  {openTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Priority: {task.priority} • Status: {task.status}
                        </p>
                      </div>
                      {task.deadline && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Link href="/tasks">
                <Button variant="outline" className="w-full mt-4">View All Tasks</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Upcoming Meetings</CardTitle>
              <CardDescription className="text-foreground">Your scheduled meetings</CardDescription>
            </CardHeader>
            <CardContent>
              {meetingsLoading ? (
                <p className="text-foreground">Loading meetings...</p>
              ) : upcomingMeetings.length === 0 ? (
                <p className="text-muted-foreground">No upcoming meetings</p>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetings.slice(0, 5).map(meeting => (
                    <div key={meeting.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {meeting.location || 'No location'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(meeting.meetingDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/meetings">
                <Button variant="outline" className="w-full mt-4">View All Meetings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
