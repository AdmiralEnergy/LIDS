import { useQuery } from '@tanstack/react-query';
import { Card, Table, Typography, Space, Tag, Spin, Alert, Progress, Statistic, Row, Col } from 'antd';
import { TrophyOutlined, FireOutlined, RiseOutlined, UserOutlined } from '@ant-design/icons';
import { getLeaderboard, getTodayStats, getWorkspaceMembers } from '../lib/twentyStatsApi';
import { RANKS } from '../features/progression/config/ranks';

const { Title, Text } = Typography;

interface LeaderboardEntry {
  name: string;
  workspaceMemberId: string;
  totalXp: number;
  currentLevel: number;
  currentRank: string;
  todayDials?: number;
  todayAppointments?: number;
}

const rankColors: Record<string, string> = {
  'E-1': '#64748b',
  'E-2': '#64748b',
  'E-3': '#64748b',
  'E-4': '#22c55e',
  'E-5': '#c9a648',
  'E-6': '#3b82f6',
  'E-7': '#8b5cf6',
};

const getRankName = (grade: string): string => {
  const rank = Object.values(RANKS).find(r => r.grade === grade);
  return rank?.name || grade;
};

const getMedalEmoji = (position: number): string => {
  switch (position) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${position}`;
  }
};

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: members } = useQuery({
    queryKey: ['workspaceMembers'],
    queryFn: getWorkspaceMembers,
  });

  const columns = [
    {
      title: 'Rank',
      key: 'position',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <Text style={{ fontSize: 20 }}>{getMedalEmoji(index + 1)}</Text>
      ),
    },
    {
      title: 'Rep',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: LeaderboardEntry) => (
        <Space>
          <UserOutlined />
          <Text strong>{name || 'Unknown'}</Text>
          <Tag color={rankColors[record.currentRank] || '#64748b'}>
            {getRankName(record.currentRank)}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'currentLevel',
      key: 'currentLevel',
      width: 100,
      render: (level: number) => (
        <Tag color="blue" style={{ fontWeight: 'bold' }}>
          LVL {level}
        </Tag>
      ),
    },
    {
      title: 'Total XP',
      dataIndex: 'totalXp',
      key: 'totalXp',
      width: 150,
      render: (xp: number) => (
        <Space>
          <FireOutlined style={{ color: '#f59e0b' }} />
          <Text strong>{xp?.toLocaleString() || 0}</Text>
        </Space>
      ),
    },
    {
      title: 'Today',
      key: 'today',
      width: 150,
      render: (record: LeaderboardEntry) => (
        <Space>
          <Text type="secondary">
            {record.todayDials || 0} dials • {record.todayAppointments || 0} appts
          </Text>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Leaderboard"
        description="Could not connect to Twenty CRM. Make sure the API is running and the API key is configured."
        type="error"
        showIcon
      />
    );
  }

  const totalTeamXp = leaderboard?.reduce((sum, entry) => sum + (entry.totalXp || 0), 0) || 0;
  const avgXp = leaderboard?.length ? Math.round(totalTeamXp / leaderboard.length) : 0;

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <TrophyOutlined style={{ fontSize: 32, color: '#f59e0b' }} />
            <Title level={2} style={{ margin: 0 }}>Team Leaderboard</Title>
          </Space>
          <Tag color="green">Live - Updates every 30s</Tag>
        </div>

        {/* Team Stats */}
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Team Members"
                value={members?.length || leaderboard?.length || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Team XP"
                value={totalTeamXp}
                prefix={<FireOutlined style={{ color: '#f59e0b' }} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Average XP"
                value={avgXp}
                prefix={<RiseOutlined style={{ color: '#22c55e' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Leaderboard Table */}
        <Card>
          <Table
            dataSource={leaderboard || []}
            columns={columns}
            rowKey="workspaceMemberId"
            pagination={false}
            size="large"
            rowClassName={(_, index) => {
              if (index === 0) return 'leaderboard-gold';
              if (index === 1) return 'leaderboard-silver';
              if (index === 2) return 'leaderboard-bronze';
              return '';
            }}
          />
        </Card>

        {/* Empty State */}
        {(!leaderboard || leaderboard.length === 0) && (
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <TrophyOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
              <Title level={4} type="secondary">No progression data yet</Title>
              <Text type="secondary">
                Start making calls to track your progress. Stats will appear here automatically.
              </Text>
            </div>
          </Card>
        )}

        {/* Info */}
        <Card size="small">
          <Text type="secondary">
            Stats are stored in Twenty CRM and shared across all devices.
            XP is earned from calls, appointments, and deals per the{' '}
            <a href="/progression">Sales Operative Progression System</a>.
          </Text>
        </Card>
      </Space>

      <style>{`
        .leaderboard-gold {
          background: linear-gradient(90deg, rgba(255,215,0,0.1) 0%, transparent 100%);
        }
        .leaderboard-silver {
          background: linear-gradient(90deg, rgba(192,192,192,0.1) 0%, transparent 100%);
        }
        .leaderboard-bronze {
          background: linear-gradient(90deg, rgba(205,127,50,0.1) 0%, transparent 100%);
        }
      `}</style>
    </div>
  );
}
