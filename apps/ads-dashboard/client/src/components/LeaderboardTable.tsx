/**
 * LeaderboardTable.tsx - Extracted leaderboard table component
 *
 * Shows team rankings by XP with medals, levels, and today's stats.
 * Can be embedded in dashboard or used standalone.
 */

import { Table, Space, Tag, Spin, Empty } from 'antd';
import { TrophyOutlined, FireOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../lib/twentyStatsApi';
import { RANKS } from '../features/progression/config/ranks';

interface LeaderboardEntry {
  name: string;
  workspaceMemberId: string;
  totalXp: number;
  currentLevel: number;
  currentRank: string;
  todayDials?: number;
  todayAppointments?: number;
}

interface LeaderboardTableProps {
  /** Optional pre-loaded data (skip fetching) */
  data?: LeaderboardEntry[];
  /** Current user's workspace member ID for highlighting */
  currentUserId?: string;
  /** Show compact version for embedding */
  compact?: boolean;
  /** External loading state */
  loading?: boolean;
  /** Maximum entries to show (compact mode) */
  maxEntries?: number;
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

export function LeaderboardTable({
  data: externalData,
  currentUserId,
  compact = false,
  loading: externalLoading,
  maxEntries,
}: LeaderboardTableProps) {
  // Fetch data if not provided externally
  const { data: fetchedData, isLoading: fetchLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    enabled: !externalData,
    refetchInterval: 30000,
  });

  const leaderboard = externalData || fetchedData;
  const isLoading = externalLoading ?? fetchLoading;

  // Limit entries if maxEntries is set
  const displayData = maxEntries ? leaderboard?.slice(0, maxEntries) : leaderboard;

  const columns = compact ? [
    {
      title: '',
      key: 'position',
      width: 40,
      render: (_: unknown, __: unknown, index: number) => (
        <span style={{ fontSize: 16 }}>{getMedalEmoji(index + 1)}</span>
      ),
    },
    {
      title: 'Rep',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: LeaderboardEntry) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontWeight: record.workspaceMemberId === currentUserId ? 600 : 400,
            color: record.workspaceMemberId === currentUserId ? '#c9a648' : '#fff',
          }}>
            {name || 'Unknown'}
          </span>
          <Tag
            color={rankColors[record.currentRank] || '#64748b'}
            style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}
          >
            {getRankName(record.currentRank)}
          </Tag>
        </div>
      ),
    },
    {
      title: 'XP',
      dataIndex: 'totalXp',
      key: 'totalXp',
      width: 80,
      render: (xp: number) => (
        <Space size={4}>
          <FireOutlined style={{ color: '#f59e0b', fontSize: 12 }} />
          <span style={{ fontWeight: 600, color: '#fff' }}>{(xp || 0).toLocaleString()}</span>
        </Space>
      ),
    },
  ] : [
    {
      title: 'Rank',
      key: 'position',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <span style={{ fontSize: 18 }}>{getMedalEmoji(index + 1)}</span>
      ),
    },
    {
      title: 'Rep',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: LeaderboardEntry) => (
        <Space>
          <UserOutlined style={{ color: record.workspaceMemberId === currentUserId ? '#c9a648' : undefined }} />
          <span style={{
            fontWeight: record.workspaceMemberId === currentUserId ? 600 : 400,
            color: record.workspaceMemberId === currentUserId ? '#c9a648' : '#fff',
          }}>
            {name || 'Unknown'}
          </span>
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
      width: 80,
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
      width: 120,
      render: (xp: number) => (
        <Space>
          <FireOutlined style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 600 }}>{(xp || 0).toLocaleString()}</span>
        </Space>
      ),
    },
    {
      title: 'Today',
      key: 'today',
      width: 140,
      render: (record: LeaderboardEntry) => (
        <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          {record.todayDials || 0} dials • {record.todayAppointments || 0} appts
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: compact ? 24 : 48 }}>
        <Spin />
      </div>
    );
  }

  if (!displayData || displayData.length === 0) {
    return (
      <Empty
        image={<TrophyOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.1)' }} />}
        description={
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            No progression data yet. Start making calls!
          </span>
        }
        style={{ padding: compact ? 24 : 48 }}
      />
    );
  }

  return (
    <Table
      dataSource={displayData}
      columns={columns}
      rowKey="workspaceMemberId"
      pagination={false}
      size={compact ? 'small' : 'middle'}
      rowClassName={(record, index) => {
        if (record.workspaceMemberId === currentUserId) return 'leaderboard-current-user';
        if (index === 0) return 'leaderboard-gold';
        if (index === 1) return 'leaderboard-silver';
        if (index === 2) return 'leaderboard-bronze';
        return '';
      }}
      style={{
        background: 'transparent',
      }}
    />
  );
}

export default LeaderboardTable;
