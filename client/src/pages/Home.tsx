import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Bell, Sparkles, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { type Reminder } from "@shared/schema";
import { ReminderCard } from "@/components/ReminderCard";
import { ReminderDialog } from "@/components/ReminderDialog";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const { user, signOut } = useAuth();

  const { data: reminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReminder(null);
  };

  const now = new Date();
  const activeReminders = reminders?.filter(r => !r.completed && new Date(r.scheduledFor) > now) || [];
  const overdueReminders = reminders?.filter(r => !r.completed && new Date(r.scheduledFor) <= now) || [];
  const completedReminders = reminders?.filter(r => r.completed) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <Bell className="h-6 w-6 text-primary-foreground" />
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-gradient-to-br from-green-400 to-green-500 ring-2 ring-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  QA Reminders
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Never miss a testing deadline</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-card border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-semibold text-foreground">{activeReminders.length}</span>
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                {overdueReminders.length > 0 && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm font-semibold text-destructive">{overdueReminders.length}</span>
                      <span className="text-sm text-muted-foreground">Overdue</span>
                    </div>
                  </>
                )}
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                size="lg"
                className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                data-testid="button-create-reminder"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline font-semibold">New Reminder</span>
                <span className="sm:hidden font-semibold">New</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm">
                        {user?.email ? getUserInitials(user.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Manage Your Reminders</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Schedule QA tasks and receive automated SMS notifications
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-8">
          <TabsList className="grid w-full max-w-lg grid-cols-3 h-12 p-1 bg-card shadow-sm" data-testid="tabs-reminder-filter">
            <TabsTrigger value="active" className="gap-2 data-[state=active]:shadow-md" data-testid="tab-active">
              <span>Active</span>
              {activeReminders.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {activeReminders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-2 data-[state=active]:shadow-md" data-testid="tab-overdue">
              <span>Overdue</span>
              {overdueReminders.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                  {overdueReminders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 data-[state=active]:shadow-md" data-testid="tab-completed">
              <span>Completed</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 animate-in fade-in-50 duration-300">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : activeReminders.length === 0 ? (
              <EmptyState
                title="No active reminders"
                description="Create your first QA reminder to get started with automated SMS notifications."
                actionLabel="Create Reminder"
                onAction={() => setIsDialogOpen(true)}
              />
            ) : (
              <div className="space-y-4">
                {activeReminders.map((reminder, index) => (
                  <div
                    key={reminder.id}
                    className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={handleEdit}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4 animate-in fade-in-50 duration-300">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : overdueReminders.length === 0 ? (
              <EmptyState
                title="No overdue reminders"
                description="You're all caught up! All your reminders are scheduled for the future."
                variant="success"
              />
            ) : (
              <div className="space-y-4">
                {overdueReminders.map((reminder, index) => (
                  <div
                    key={reminder.id}
                    className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={handleEdit}
                      isOverdue
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 animate-in fade-in-50 duration-300">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : completedReminders.length === 0 ? (
              <EmptyState
                title="No completed reminders"
                description="Completed reminders will appear here once you mark them as done."
              />
            ) : (
              <div className="space-y-4">
                {completedReminders.map((reminder, index) => (
                  <div
                    key={reminder.id}
                    className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ReminderCard
                      reminder={reminder}
                      onEdit={handleEdit}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ReminderDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        reminder={editingReminder}
      />
    </div>
  );
}
