import { Modal, Button, Input, Typography } from 'antd';
import { useState } from 'react';
import { CheckCircle, Clock, Voicemail, PhoneMissed, XCircle, AlertTriangle, Ban } from 'lucide-react';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (disposition: string, notes: string) => void;
  leadName: string;
  callDuration: string;
}

const DISPOSITIONS = [
  { key: 'contact', label: 'Contact', color: '#52c41a', icon: CheckCircle },
  { key: 'callback', label: 'Callback', color: '#1890ff', icon: Clock },
  { key: 'voicemail', label: 'Voicemail', color: '#722ed1', icon: Voicemail },
  { key: 'no_answer', label: 'No Answer', color: '#8c8c8c', icon: PhoneMissed },
  { key: 'not_interested', label: 'Not Interested', color: '#fa8c16', icon: XCircle },
  { key: 'wrong_number', label: 'Wrong Number', color: '#f5222d', icon: AlertTriangle },
  { key: 'dnc', label: 'DNC Request', color: '#000000', icon: Ban },
];

export function DispositionModal({ open, onClose, onSubmit, leadName, callDuration }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected, notes);
      setSelected(null);
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal
      title="Call Disposition"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>{leadName}</Text>
        <Text type="secondary" style={{ marginLeft: 8 }}>Duration: {callDuration}</Text>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {DISPOSITIONS.map(d => {
          const Icon = d.icon;
          return (
            <Button
              key={d.key}
              onClick={() => setSelected(d.key)}
              style={{
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 8,
                backgroundColor: selected === d.key ? d.color : undefined,
                color: selected === d.key ? '#fff' : undefined,
                borderColor: d.color,
              }}
              data-testid={`button-disposition-${d.key}`}
            >
              <Icon size={18} />
              {d.label}
            </Button>
          );
        })}
      </div>

      <TextArea
        placeholder="Add notes about the call..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        style={{ marginBottom: 16 }}
        data-testid="input-disposition-notes"
      />

      <Button
        type="primary"
        block
        size="large"
        disabled={!selected}
        onClick={handleSubmit}
        data-testid="button-save-disposition"
      >
        Save & Next Lead
      </Button>
    </Modal>
  );
}
