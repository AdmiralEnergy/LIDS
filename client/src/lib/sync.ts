import { db } from './db';
import { getSettings, getTwentyCrmUrl } from './settings';

export async function syncPendingActivities(): Promise<number> {
  const settings = getSettings();

  if (!navigator.onLine || !settings.twentyApiKey) {
    return 0;
  }

  const pending = await db.syncQueue.where('table').equals('activities').toArray();
  let synced = 0;

  for (const item of pending) {
    try {
      const activity = item.data;
      const typeLabels: Record<string, string> = {
        call: 'Call',
        sms: 'SMS',
        email: 'Email',
        note: 'Note',
        voicemail: 'Voicemail',
      };

      const title = `${typeLabels[activity.type] || activity.type} - ${activity.metadata?.disposition || 'Logged'}`;
      let body = activity.content || '';

      if (activity.metadata?.transcription) {
        body += `\n\n--- Transcription ---\n${activity.metadata.transcription}`;
      }

      const response = await fetch(`${getTwentyCrmUrl()}/rest/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.twentyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body, personId: activity.leadId }),
      });

      if (response.ok) {
        await db.activities.update(activity.id, { syncedAt: new Date() });
        await db.syncQueue.delete(item.id);
        synced++;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      await db.syncQueue.update(item.id, { attempts: item.attempts + 1 });
    }
  }

  return synced;
}

export function startAutoSync(intervalMs = 30000): () => void {
  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncPendingActivities().then(count => {
        if (count > 0) console.log(`Synced ${count} activities to Twenty CRM`);
      });
    }
  }, intervalMs);

  return () => clearInterval(interval);
}
