import { useCallback } from 'react';
import { db, Activity } from '../lib/db';
import { getSettings, getTwentyCrmUrl } from '../lib/settings';

function formatActivityAsNote(activity: Activity): { title: string; body: string } {
  const typeLabels: Record<string, string> = {
    call: 'Call',
    sms: 'SMS',
    email: 'Email',
    note: 'Note',
    voicemail: 'Voicemail',
  };

  const title = `${typeLabels[activity.type] || activity.type} - ${activity.metadata.disposition || 'Logged'}`;

  let body = activity.content || '';
  if (activity.metadata.duration) {
    const mins = Math.floor(activity.metadata.duration / 60);
    const secs = activity.metadata.duration % 60;
    body += `\n\nDuration: ${mins}:${secs.toString().padStart(2, '0')}`;
  }
  if (activity.metadata.transcription) {
    body += `\n\n--- Transcription ---\n${activity.metadata.transcription}`;
  }
  if (activity.metadata.subject) {
    body = `Subject: ${activity.metadata.subject}\n\n${body}`;
  }

  return { title, body };
}

async function pushActivityToTwenty(activity: Activity): Promise<void> {
  const settings = getSettings();
  if (!settings.twentyApiKey) throw new Error('No Twenty API key');

  const { title, body } = formatActivityAsNote(activity);

  const response = await fetch(`${getTwentyCrmUrl()}/rest/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.twentyApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, personId: activity.leadId }),
  });

  if (!response.ok) {
    throw new Error(`Twenty CRM error: ${response.status}`);
  }
}

export function useActivityLog() {
  const logActivity = useCallback(async (activity: Omit<Activity, 'id' | 'createdAt'>) => {
    const newActivity: Activity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      syncedAt: undefined,
    };

    await db.activities.add(newActivity);

    const settings = getSettings();
    if (navigator.onLine && settings.twentyApiKey) {
      try {
        await pushActivityToTwenty(newActivity);
        await db.activities.update(newActivity.id, { syncedAt: new Date() });
      } catch {
        await db.syncQueue.add({
          id: crypto.randomUUID(),
          operation: 'create',
          table: 'activities',
          data: newActivity,
          createdAt: new Date(),
          attempts: 0,
        });
      }
    } else {
      await db.syncQueue.add({
        id: crypto.randomUUID(),
        operation: 'create',
        table: 'activities',
        data: newActivity,
        createdAt: new Date(),
        attempts: 0,
      });
    }

    return newActivity;
  }, []);

  const getActivitiesForLead = useCallback(async (leadId: string) => {
    return db.activities.where('leadId').equals(leadId).reverse().sortBy('createdAt');
  }, []);

  return { logActivity, getActivitiesForLead };
}
