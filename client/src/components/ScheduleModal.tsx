import { useState } from 'react';
import { Modal, Form, DatePicker, TimePicker, Select, Input, Checkbox, Button, message } from 'antd';
import { Calendar } from 'lucide-react';
import dayjs from 'dayjs';

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  lead: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  onSchedule: (appointment: AppointmentData) => Promise<void>;
}

interface AppointmentData {
  leadId: string;
  leadName: string;
  leadEmail?: string;
  date: string;
  time: string;
  type: 'phone_call' | 'site_visit' | 'virtual_meeting';
  notes: string;
  sendInvite: boolean;
  addToCalendar: boolean;
}

export function ScheduleModal({ open, onClose, lead, onSchedule }: ScheduleModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!lead) return;

    try {
      setLoading(true);
      const values = await form.validateFields();

      const appointment: AppointmentData = {
        leadId: lead.id,
        leadName: lead.name,
        leadEmail: lead.email,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        type: values.type,
        notes: values.notes || '',
        sendInvite: values.sendInvite || false,
        addToCalendar: values.addToCalendar || false,
      };

      await onSchedule(appointment);
      message.success('Appointment scheduled successfully!');
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} />
          <span>Schedule Appointment</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Schedule & Send
        </Button>
      ]}
      styles={{ body: { padding: '20px 24px' } }}
    >
      {lead && (
        <div style={{
          background: '#050505',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          border: '0.5px solid rgba(0, 255, 255, 0.2)'
        }}>
          <strong style={{ color: '#00ffff' }}>{lead.name}</strong>
          {lead.phone && <div style={{ color: '#888', fontSize: 12 }}>{lead.phone}</div>}
          {lead.email && <div style={{ color: '#888', fontSize: 12 }}>{lead.email}</div>}
        </div>
      )}

      <Form form={form} layout="vertical" initialValues={{ type: 'site_visit', sendInvite: true, addToCalendar: true }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="date" label="Date" rules={[{ required: true }]} style={{ flex: 1 }}>
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item name="time" label="Time" rules={[{ required: true }]} style={{ flex: 1 }}>
            <TimePicker style={{ width: '100%' }} format="h:mm A" minuteStep={15} />
          </Form.Item>
        </div>

        <Form.Item name="type" label="Appointment Type" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="phone_call">Phone Call</Select.Option>
            <Select.Option value="site_visit">Site Visit</Select.Option>
            <Select.Option value="virtual_meeting">Virtual Meeting</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} placeholder="Initial consultation, roof assessment, etc." />
        </Form.Item>

        <Form.Item name="sendInvite" valuePropName="checked">
          <Checkbox>Send calendar invite to lead via email</Checkbox>
        </Form.Item>

        <Form.Item name="addToCalendar" valuePropName="checked">
          <Checkbox>Add to my calendar (via Twenty CRM)</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
