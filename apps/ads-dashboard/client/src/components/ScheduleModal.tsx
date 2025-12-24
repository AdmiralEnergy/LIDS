import { useState } from 'react';
import { Modal, Form, DatePicker, TimePicker, Select, Input, Button, message, Alert } from 'antd';
import { Calendar, Check, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { createAppointment } from '../lib/twentyCalendar';
import { getSettings } from '../lib/settings';

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  lead: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  onScheduled?: () => void;
}

export function ScheduleModal({ open, onClose, lead, onScheduled }: ScheduleModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const settings = getSettings();
  const isConfigured = Boolean(settings.twentyApiKey);

  const handleSubmit = async () => {
    if (!isConfigured) {
      message.error('Twenty CRM not configured. Add your API key in Settings.');
      return;
    }

    try {
      setLoading(true);
      const values = await form.validateFields();

      await createAppointment({
        leadId: lead?.id || 'quick-schedule',
        leadName: lead?.name || values.contactName || 'Quick Appointment',
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        durationMinutes: values.duration || 60,
        type: values.type,
        notes: values.notes,
        location: values.location,
      });

      setSuccess(true);
      message.success('Appointment created in Twenty CRM!');

      setTimeout(() => {
        form.resetFields();
        setSuccess(false);
        onScheduled?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Schedule error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} style={{ color: '#00ffff' }} />
          <span>Schedule Appointment</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={success ? null : [
        <Button key="cancel" onClick={handleClose}>Cancel</Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          disabled={!isConfigured}
          style={{ background: '#00ffff', borderColor: '#00ffff', color: '#000' }}
        >
          Create Appointment
        </Button>
      ]}
      styles={{ body: { padding: '20px 24px' } }}
    >
      {success ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(0, 255, 136, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Check size={32} style={{ color: '#00ff88' }} />
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Appointment Created!</div>
          <div style={{ color: '#888', fontSize: 14, marginTop: 8 }}>
            Auto-syncs with Google Calendar via Twenty CRM
          </div>
        </div>
      ) : (
        <>
          {!isConfigured && (
            <Alert
              message="Twenty CRM Not Configured"
              description="Add your Twenty API key in Settings to enable scheduling."
              type="warning"
              showIcon
              icon={<AlertCircle size={16} />}
              style={{ marginBottom: 16 }}
            />
          )}

          {lead ? (
            <div style={{
              background: '#050505', padding: 12, borderRadius: 8, marginBottom: 16,
              border: '0.5px solid rgba(0, 255, 255, 0.2)'
            }}>
              <strong style={{ color: '#00ffff' }}>{lead.name}</strong>
              {lead.phone && <div style={{ color: '#888', fontSize: 12 }}>{lead.phone}</div>}
              {lead.email && <div style={{ color: '#888', fontSize: 12 }}>{lead.email}</div>}
            </div>
          ) : (
            <div style={{
              background: '#050505', padding: 12, borderRadius: 8, marginBottom: 16,
              border: '0.5px solid rgba(255, 191, 0, 0.2)'
            }}>
              <div style={{ color: '#ffbf00', fontSize: 12, marginBottom: 4 }}>Quick Schedule</div>
              <div style={{ color: '#888', fontSize: 11 }}>No lead selected - enter contact info below</div>
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            initialValues={{ type: 'site_visit', duration: 60 }}
          >
            {!lead && (
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="contactName" label="Contact Name" style={{ flex: 1 }}>
                  <Input placeholder="John Smith" />
                </Form.Item>
                <Form.Item name="contactEmail" label="Email" style={{ flex: 1 }}>
                  <Input placeholder="john@example.com" />
                </Form.Item>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Select date' }]} style={{ flex: 1 }}>
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  format="MMM D, YYYY"
                />
              </Form.Item>
              <Form.Item name="time" label="Time" rules={[{ required: true, message: 'Select time' }]} style={{ flex: 1 }}>
                <TimePicker style={{ width: '100%' }} format="h:mm A" minuteStep={15} use12Hours />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Select>
                  <Select.Option value="phone_call">📞 Phone Call</Select.Option>
                  <Select.Option value="site_visit">🏠 Site Visit</Select.Option>
                  <Select.Option value="virtual_meeting">💻 Virtual Meeting</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="duration" label="Duration" style={{ flex: 1 }}>
                <Select>
                  <Select.Option value={15}>15 min</Select.Option>
                  <Select.Option value={30}>30 min</Select.Option>
                  <Select.Option value={45}>45 min</Select.Option>
                  <Select.Option value={60}>1 hour</Select.Option>
                  <Select.Option value={90}>1.5 hours</Select.Option>
                  <Select.Option value={120}>2 hours</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="location" label="Location">
              <Input placeholder="Address, Zoom link, or leave blank" />
            </Form.Item>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={2} placeholder="Initial consultation, roof assessment..." />
            </Form.Item>

            <div style={{
              background: 'rgba(0, 255, 255, 0.05)', padding: 12, borderRadius: 8,
              border: '0.5px solid rgba(0, 255, 255, 0.1)', marginTop: 8
            }}>
              <div style={{ color: '#00ffff', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                CALENDAR SYNC
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>
                ✓ Created in Twenty CRM<br/>
                ✓ Auto-syncs to Google Calendar<br/>
                ✓ Lead linked as participant
              </div>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
}
