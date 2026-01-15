import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newDateTime, setNewDateTime] = useState("");
  
  const utils = trpc.useUtils();

  const { data: meetings, isLoading: meetingsLoading } = trpc.meetings.list.useQuery();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  
  const rescheduleMutation = trpc.meetings.update.useMutation({
    onSuccess: () => {
      utils.meetings.list.invalidate();
      toast.success("Meeting rescheduled successfully!");
      setRescheduleDialogOpen(false);
      setSelectedMeeting(null);
      setNewDateTime("");
    },
    onError: (error) => {
      toast.error(`Failed to reschedule: ${error.message}`);
    },
  });

  const isLoading = meetingsLoading || tasksLoading;

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleReschedule = () => {
    if (!selectedMeeting || !newDateTime) return;
    
    rescheduleMutation.mutate({
      id: selectedMeeting.id,
      meetingDate: new Date(newDateTime),
    });
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Get week days
  const getWeekDays = (date: Date) => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    const meetingsOnDate = meetings?.filter(m => 
      new Date(m.meetingDate).toDateString() === dateStr && m.status !== 'cancelled'
    ) || [];
    const tasksOnDate = tasks?.filter(t => 
      t.deadline && new Date(t.deadline).toDateString() === dateStr
    ) || [];

    return { meetings: meetingsOnDate, tasks: tasksOnDate };
  };

  // Check if a meeting has conflicts
  const hasConflict = (meeting: any) => {
    if (!meetings) return false;
    const meetingStart = new Date(meeting.meetingDate);
    const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration || 60) * 60000);
    
    return meetings.some(other => {
      if (other.id === meeting.id || other.status === 'cancelled') return false;
      const otherStart = new Date(other.meetingDate);
      const otherEnd = new Date(otherStart.getTime() + (other.duration || 60) * 60000);
      return (meetingStart < otherEnd && meetingEnd > otherStart);
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthDays = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
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
          <h1 className="text-3xl font-bold text-black">Calendar</h1>
          <p className="text-gray-600 mt-1">View meetings and task deadlines</p>
        </div>
        <Button onClick={goToToday} variant="outline">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Today
        </Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week" | "day")} className="mb-6">
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black">{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={view === "month" ? goToPreviousMonth : view === "week" ? goToPreviousWeek : goToPreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={view === "month" ? goToNextMonth : view === "week" ? goToNextWeek : goToNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : view === "month" ? (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-black py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {monthDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="min-h-24 border rounded-lg bg-gray-50"></div>;
                }

                const { meetings: dayMeetings, tasks: dayTasks } = getEventsForDate(day);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 border rounded-lg p-2 hover:bg-gray-50 transition-colors ${
                      isCurrentDay ? 'bg-blue-50 border-blue-500' : 'bg-white'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-black'}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayMeetings.map(meeting => {
                        const conflict = hasConflict(meeting);
                        return (
                          <div
                            key={meeting.id}
                            className={`text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 ${
                              conflict ? 'bg-red-100 text-red-800 border border-red-500' : 'bg-blue-100 text-blue-800'
                            }`}
                            title={`${meeting.title}${conflict ? ' (CONFLICT)' : ''}`}
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setRescheduleDialogOpen(true);
                            }}
                          >
                            📅 {meeting.title} {conflict && '⚠️'}
                          </div>
                        );
                      })}
                      {dayTasks.map(task => (
                        <div
                          key={task.id}
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded truncate"
                          title={task.title}
                        >
                          ✓ {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : view === "week" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => {
                  const { meetings: dayMeetings, tasks: dayTasks } = getEventsForDate(day);
                  const isCurrentDay = isToday(day);

                  return (
                    <div key={day.toISOString()} className="space-y-2">
                      <div className={`text-center p-2 rounded-lg ${isCurrentDay ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'}`}>
                        <div className="text-xs font-semibold">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-bold">{day.getDate()}</div>
                      </div>
                      <div className="space-y-1 min-h-48">
                        {dayMeetings.map(meeting => {
                          const conflict = hasConflict(meeting);
                          return (
                            <div
                              key={meeting.id}
                              className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 ${
                                conflict ? 'bg-red-100 text-red-800 border-2 border-red-500' : 'bg-blue-100 text-blue-800'
                              }`}
                              onClick={() => {
                                setSelectedMeeting(meeting);
                                setRescheduleDialogOpen(true);
                              }}
                            >
                              <div className="font-semibold">📅 {meeting.title}</div>
                              <div className="text-xs mt-1">
                                {new Date(meeting.meetingDate).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              {conflict && <div className="text-xs mt-1 font-bold">⚠️ Conflict</div>}
                            </div>
                          );
                        })}
                        {dayTasks.map(task => (
                          <div
                            key={task.id}
                            className="text-xs bg-green-100 text-green-800 p-2 rounded"
                          >
                            <div className="font-semibold">✓ {task.title}</div>
                            <div className="text-xs mt-1">
                              {task.priority} priority
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-center p-4 bg-blue-500 text-white rounded-lg">
                  <div className="text-sm font-semibold">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className="text-3xl font-bold">{currentDate.getDate()}</div>
                  <div className="text-sm">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                {(() => {
                  const { meetings: dayMeetings, tasks: dayTasks } = getEventsForDate(currentDate);
                  return (
                    <div className="space-y-3">
                      {dayMeetings.length === 0 && dayTasks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          No events scheduled for this day
                        </div>
                      ) : (
                        <>
                          {dayMeetings.map(meeting => {
                            const conflict = hasConflict(meeting);
                            return (
                              <div
                                key={meeting.id}
                                className={`p-4 rounded-lg cursor-pointer hover:opacity-80 ${
                                  conflict ? 'bg-red-100 border-2 border-red-500' : 'bg-blue-100'
                                }`}
                                onClick={() => {
                                  setSelectedMeeting(meeting);
                                  setRescheduleDialogOpen(true);
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold text-lg text-black">📅 {meeting.title}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {new Date(meeting.meetingDate).toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit' 
                                      })} • {meeting.duration || 60} min
                                    </div>
                                    {meeting.location && (
                                      <div className="text-sm text-gray-600 mt-1">📍 {meeting.location}</div>
                                    )}
                                    {meeting.participants && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        👥 {JSON.parse(meeting.participants).length} participants
                                      </div>
                                    )}
                                  </div>
                                  {conflict && (
                                    <div className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                                      ⚠️ CONFLICT
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {dayTasks.map(task => (
                            <div
                              key={task.id}
                              className="p-4 bg-green-100 rounded-lg"
                            >
                              <div className="font-semibold text-lg text-black">✓ {task.title}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {task.priority} priority • Due today
                              </div>
                              {task.description && (
                                <div className="text-sm text-gray-600 mt-2">{task.description}</div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-6 flex gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span className="text-sm text-black">Meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span className="text-sm text-black">Task Deadlines</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
          <span className="text-sm text-black">Conflicts</span>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Meeting</DialogTitle>
            <DialogDescription>
              Update the date and time for "{selectedMeeting?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="datetime">New Date & Time</Label>
              <input
                id="datetime"
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-md"
              />
            </div>
            {selectedMeeting && (
              <div className="text-sm text-gray-600">
                <p><strong>Current:</strong> {new Date(selectedMeeting.meetingDate).toLocaleString()}</p>
                <p><strong>Duration:</strong> {selectedMeeting.duration || 60} minutes</p>
                {selectedMeeting.location && <p><strong>Location:</strong> {selectedMeeting.location}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={!newDateTime || rescheduleMutation.isPending}>
              {rescheduleMutation.isPending ? "Rescheduling..." : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
