import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { insertReminderSchema, type InsertReminder, type Reminder } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReminderDialogProps {
  open: boolean;
  onClose: () => void;
  reminder?: Reminder | null;
}

export function ReminderDialog({ open, onClose, reminder }: ReminderDialogProps) {
  const { toast } = useToast();
  const isEditing = !!reminder;

  const form = useForm<InsertReminder>({
    resolver: zodResolver(insertReminderSchema),
    defaultValues: {
      title: "",
      description: "",
      phoneNumber: "",
      scheduledFor: "",
    },
  });

  useEffect(() => {
    if (reminder) {
      const scheduledDate = new Date(reminder.scheduledFor);
      const localDate = format(scheduledDate, "yyyy-MM-dd");
      const localTime = format(scheduledDate, "HH:mm");
      
      form.reset({
        title: reminder.title,
        description: reminder.description || "",
        phoneNumber: reminder.phoneNumber,
        scheduledFor: `${localDate}T${localTime}`,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        phoneNumber: "",
        scheduledFor: "",
      });
    }
  }, [reminder, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertReminder) => {
      return apiRequest("POST", "/api/reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Reminder created",
        description: "Your reminder has been scheduled successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertReminder) => {
      return apiRequest("PATCH", `/api/reminders/${reminder?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Reminder updated",
        description: "Your reminder has been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertReminder) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" data-testid="dialog-reminder">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              {isEditing ? "Edit Reminder" : "Create New Reminder"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {isEditing 
              ? "Update the details of your QA reminder below." 
              : "Schedule a new QA reminder with automated SMS notification."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Test login functionality"
                      className="text-base h-11"
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add detailed notes about this QA task..."
                      className="min-h-28 resize-none text-base"
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Include specific testing scenarios, edge cases, or requirements.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+1234567890"
                      className="font-mono text-base h-11"
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <FormDescription>
                    Include country code (e.g., +1 for US). E.164 format recommended.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Schedule Date & Time</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="datetime-local"
                      className="text-base h-11"
                      data-testid="input-datetime"
                    />
                  </FormControl>
                  <FormDescription>
                    The SMS reminder will be sent automatically at this time.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                size="lg"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                size="lg"
                className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                data-testid="button-submit"
              >
                {isPending ? "Saving..." : isEditing ? "Update Reminder" : "Create Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
