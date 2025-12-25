import { Typography, Timeline, Tag, Card, Space, Avatar, Empty } from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import type { Activity, Lead } from "@shared/schema";

const { Title, Text } = Typography;

const activityConfig: Record<string, { icon: any; color: string; label: string }> = {
  call: {
    icon: PhoneOutlined,
    color: "#c9a648",
    label: "Call",
  },
  email: {
    icon: MailOutlined,
    color: "#1890ff",
    label: "Email",
  },
  meeting: {
    icon: CalendarOutlined,
    color: "#722ed1",
    label: "Meeting",
  },
  note: {
    icon: FileTextOutlined,
    color: "#13c2c2",
    label: "Note",
  },
  status: {
    icon: CheckCircleOutlined,
    color: "#52c41a",
    label: "Status Change",
  },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

export function ActivityPage() {
  const { result: activitiesResult, query: activitiesQuery } = useList<Activity>({
    resource: "activities",
  });

  const { result: leadsResult } = useList<Lead>({
    resource: "leads",
  });

  const activities = activitiesResult?.data || [];
  const leads = leadsResult?.data || [];
  const activitiesLoading = activitiesQuery.isLoading;

  const getLeadName = (leadId: string) => {
    const lead = leads.find((l: Lead) => l.id === leadId);
    return lead?.name || "Unknown";
  };

  const getLeadCompany = (leadId: string) => {
    const lead = leads.find((l: Lead) => l.id === leadId);
    return lead?.company || "";
  };

  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const twoDaysAgoStart = new Date(todayStart.getTime() - 172800000);

  const todayActivities = sortedActivities.filter((a) => {
    if (!a.createdAt) return false;
    const actDate = new Date(a.createdAt);
    return actDate >= todayStart;
  });

  const yesterdayActivities = sortedActivities.filter((a) => {
    if (!a.createdAt) return false;
    const actDate = new Date(a.createdAt);
    return actDate >= yesterdayStart && actDate < todayStart;
  });

  const olderActivities = sortedActivities.filter((a) => {
    if (!a.createdAt) return false;
    const actDate = new Date(a.createdAt);
    return actDate < yesterdayStart;
  });

  const allActivities = sortedActivities;

  const renderActivityGroup = (title: string, items: Activity[]) => {
    if (items.length === 0) return null;

    return (
      <div style={{ marginBottom: 32 }}>
        <Text
          strong
          style={{
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            fontSize: 12,
            letterSpacing: 1,
            display: "block",
            marginBottom: 16,
          }}
        >
          {title}
        </Text>
        <Timeline
          items={items.map((activity) => {
            const config = activityConfig[activity.type] || activityConfig.note;
            const IconComponent = config.icon;

            return {
              dot: (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `${config.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComponent style={{ color: config.color, fontSize: 14 }} />
                </div>
              ),
              children: (
                <Card
                  size="small"
                  style={{
                    background: "#0f3654",
                    borderRadius: 8,
                    marginLeft: 8,
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <Space size={8} style={{ marginBottom: 8 }}>
                        <Tag
                          style={{
                            background: `${config.color}20`,
                            border: "none",
                            color: config.color,
                            borderRadius: 4,
                          }}
                        >
                          {config.label}
                        </Tag>
                        <Text style={{ color: "#fff", fontWeight: 500 }}>
                          {getLeadName(activity.leadId)}
                        </Text>
                        <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                          {getLeadCompany(activity.leadId)}
                        </Text>
                      </Space>
                      <Text style={{ color: "rgba(255,255,255,0.75)", display: "block" }}>
                        {activity.description}
                      </Text>
                    </div>
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {activity.createdAt ? formatTimeAgo(activity.createdAt) : ""}
                    </Text>
                  </div>
                </Card>
              ),
            };
          })}
        />
      </div>
    );
  };

  return (
    <div style={{ padding: 32 }}>
      <Title level={2} style={{ color: "#fff", marginBottom: 32 }}>
        Activity Feed
      </Title>

      <div style={{ maxWidth: 800 }}>
        {activitiesLoading ? (
          <div style={{ textAlign: "center", padding: 64 }}>
            <Text style={{ color: "rgba(255,255,255,0.5)" }}>Loading activities...</Text>
          </div>
        ) : sortedActivities.length === 0 ? (
          <Empty
            description={
              <Text style={{ color: "rgba(255,255,255,0.5)" }}>
                No activities yet
              </Text>
            }
          />
        ) : (
          <>
            {renderActivityGroup("Today", todayActivities)}
            {renderActivityGroup("Yesterday", yesterdayActivities)}
            {renderActivityGroup("Earlier", olderActivities)}
            {todayActivities.length === 0 && yesterdayActivities.length === 0 && olderActivities.length === 0 && allActivities.length > 0 && (
              renderActivityGroup("All Activities", allActivities)
            )}
          </>
        )}
      </div>
    </div>
  );
}
