import { Button, Dropdown, message } from 'antd';
import { Voicemail } from 'lucide-react';
import { getSettings, getTwilioUrl } from '../lib/settings';

const VOICEMAIL_TEMPLATES = [
  { id: 'default', name: 'Standard Introduction' },
  { id: 'followup', name: 'Follow-up Call' },
  { id: 'appointment', name: 'Appointment Reminder' },
];

interface Props {
  callSid: string | null;
  onDropped: () => void;
  disabled?: boolean;
}

export function VoicemailDropButton({ callSid, onDropped, disabled }: Props) {
  const handleDrop = async (templateId: string) => {
    if (!callSid) {
      message.error('No active call');
      return;
    }

    const settings = getSettings();
    if (settings.useNativePhone) {
      message.info('Voicemail drop not available in native phone mode');
      return;
    }

    try {
      const response = await fetch(`${getTwilioUrl()}/voicemail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callSid, templateId }),
      });

      if (!response.ok) throw new Error('Failed to drop voicemail');

      message.success('Voicemail dropped - call will end shortly');
      onDropped();
    } catch {
      message.error('Failed to drop voicemail');
    }
  };

  const items = VOICEMAIL_TEMPLATES.map(t => ({
    key: t.id,
    label: t.name,
    onClick: () => handleDrop(t.id),
  }));

  return (
    <Dropdown menu={{ items }} trigger={['click']} disabled={disabled || !callSid}>
      <Button 
        icon={<Voicemail size={16} />} 
        disabled={disabled || !callSid}
        data-testid="button-voicemail-drop"
      >
        Drop Voicemail
      </Button>
    </Dropdown>
  );
}
