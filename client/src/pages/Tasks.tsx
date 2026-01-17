import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { CheckSquare, Plus, AlertCircle, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: allTasks, isLoading } = trpc.tasks.list.useQuery();
  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success("Task created successfully");
    },
  });

  const markCompleteMutation = trpc.tasks.markComplete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      toast.success("Task marked as complete");
    },
  });

  const draftReminderMutation = trpc.email.draftReminder.useMutation({
    onSuccess: () => {
      utils.review.getPending.invalidate();
      toast.success("Reminder email drafted and sent for review");
    },
  });

  const draftEscalationMutation = trpc.email.draftEscalation.useMutation({
    onSuccess: () => {
      utils.review.getPending.invalidate();
      toast.success("Escalation email drafted and sent for review");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOwnerEmail("");
    setDeadline("");
    setPriority("medium");
  };

  const handleCreate = () => {
    if (!title) {
      toast.error("Please enter a task title");
      return;
    }

    createMutation.mutate({
      title,
      description,
      ownerEmail: ownerEmail || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      priority,
    });
  };

  const filteredTasks = allTasks?.filter(task => {
    if (filterStatus === "all") return true;
    return task.status === filterStatus;
  }) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600";
      case "high": return "text-orange-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "blocked": return "bg-orange-100 text-orange-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="-ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-foreground mt-2">Track and manage all tasks with priorities and deadlines</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Task</DialogTitle>
                <DialogDescription className="text-foreground">
                  Add a new task to track
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-foreground">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Complete project proposal"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task details and requirements"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail" className="text-foreground">Owner Email</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="deadline" className="text-foreground">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="priority" className="text-foreground">Priority</Label>
                  <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            All
          </Button>
          <Button
            variant={filterStatus === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("open")}
          >
            Open
          </Button>
          <Button
            variant={filterStatus === "in_progress" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("in_progress")}
          >
            In Progress
          </Button>
          <Button
            variant={filterStatus === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("completed")}
          >
            Completed
          </Button>
          <Button
            variant={filterStatus === "overdue" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("overdue")}
          >
            Overdue
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-foreground">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground">No tasks found</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first task to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-foreground">{task.title}</CardTitle>
                      <CardDescription className="text-foreground">
                        {task.ownerEmail && `Owner: ${task.ownerEmail}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {task.description && (
                    <p className="text-foreground mb-4">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {task.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Due: {new Date(task.deadline).toLocaleString()}</span>
                      </div>
                    )}
                    {task.status === "overdue" && (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>Overdue</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {task.status !== "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markCompleteMutation.mutate({ id: task.id })}
                        disabled={markCompleteMutation.isPending}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {task.ownerEmail && task.status !== "completed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => draftReminderMutation.mutate({ taskId: task.id })}
                          disabled={draftReminderMutation.isPending}
                        >
                          Send Reminder
                        </Button>
                        {task.status === "overdue" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => draftEscalationMutation.mutate({ taskId: task.id })}
                            disabled={draftEscalationMutation.isPending}
                          >
                            Escalate
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
