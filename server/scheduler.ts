import { storage } from "./storage";
import { sendReminderSMS } from "./twilio";

export function startReminderScheduler() {
  setInterval(async () => {
    try {
      const reminders = await storage.getReminders();
      const now = new Date();
      
      console.log(`[Scheduler] Checking ${reminders.length} reminders at ${now.toISOString()}`);

      for (const reminder of reminders) {
        console.log(`[Scheduler] Checking reminder: ${reminder.title}, Status: ${reminder.status}, Completed: ${reminder.completed}, Scheduled: ${reminder.scheduledFor}`);
        
        if (reminder.completed || reminder.status === "sent" || reminder.status === "failed") {
          console.log(`[Scheduler] Skipping reminder ${reminder.title} - already processed`);
          continue;
        }

        const scheduledTime = new Date(reminder.scheduledFor);
        console.log(`[Scheduler] Now: ${now.toISOString()}, Scheduled: ${scheduledTime.toISOString()}, Should send: ${scheduledTime <= now}`);
        
        if (scheduledTime <= now) {
          console.log(`[Scheduler] Sending reminder: ${reminder.title} to ${reminder.phoneNumber}`);
          
          const result = await sendReminderSMS(
            reminder.phoneNumber,
            reminder.title,
            reminder.description || undefined
          );

          if (result.success) {
            await storage.markReminderAsSent(reminder.id);
            console.log(`✓ Reminder sent successfully: ${reminder.title}`);
          } else {
            await storage.markReminderAsFailed(reminder.id);
            console.error(`✗ Failed to send reminder: ${reminder.title} - ${result.error}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  }, 60000);

  console.log('Reminder scheduler started (checking every 60 seconds)');
}
