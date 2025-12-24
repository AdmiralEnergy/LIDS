import { List, Tag, Typography, Empty, Spin } from 'antd';
import { Phone, MessageSquare, Mail, Edit, Voicemail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db, Activity } from '../lib/db';

const { Text } = Typography;

interface Props {
  leadId: string | null;
  refreshKey?: number;
}

const TYPE_CONFIG: Record<string, { icon: typeof Phone; color: string; label: string }> = {
  call: { icon: Phone, color: 'blue', label: 'Call' },
  sms: { icon: MessageSquare, color: 'purple', label: 'SMS' },
  email: { icon: Mail, color: 'green', label: 'Email' },
  note: { icon: Edit, color: 'gray', label: 'Note' },
  voicemail: { icon: Voicemail, color: 'orange', label: 'Voicemail' },
};

export function ActivityTimeline({ leadId, refreshKey = 0 }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setActivities([]);
      return;
    }

    setLoading(true);
    db.activities
      .where('leadId')
      .equals(leadId)
      .reverse()
      .sortBy('createdAt')
      .then(setActivities)
      .finally(() => setLoading(false));
  }, [leadId, refreshKey]);

  if (!leadId) {
    return <Empty description="Select a lead to view activity" />;
  }

  if (loading) {
    return <Spin />;
  }

  if (activities.length === 0) {
    return <Empty description="No activity yet" />;
  }

  return (
    <List
      dataSource={activities}
      renderItem={(activity) => {
        const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.note;
        const Icon = config.icon;

        return (
          <List.Item style={{ padding: '8px 0' }} data-testid={`activity-item-${activity.id}`}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Icon size={14} />
                <Tag color={config.color}>{config.label}</Tag>
                {activity.metadata.disposition && (
                  <Tag>{activity.metadata.disposition}</Tag>
                )}
                {!activity.syncedAt && (
                  <Tag color="warning">Pending sync</Tag>
                )}
                <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>
                  {new Date(activity.createdAt).toLocaleString()}
                </Text>
              </div>
              {activity.content && (
                <Text style={{ display: 'block', marginLeft: 22 }}>
                  {activity.content.substring(0, 100)}
                  {activity.content.length > 100 && '...'}
                </Text>
              )}
              {activity.metadata.duration && (
                <Text type="secondary" style={{ display: 'block', marginLeft: 22, fontSize: 12 }}>
                  Duration: {Math.floor(activity.metadata.duration / 60)}:{(activity.metadata.duration % 60).toString().padStart(2, '0')}
                </Text>
              )}
            </div>
          </List.Item>
        );
      }}
    />
  );
}
