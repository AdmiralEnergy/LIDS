/**
 * LiveWirePage - Single-page Control Room UI
 *
 * Philosophy: Correctness → Observability → Trust → Gradual Autonomy
 *
 * This UI is a control room for lead intelligence and sales AI.
 * Matches the original LIDS design from archived version.
 *
 * Layout:
 * A. SystemStateBar - Compact top bar showing system health
 * B. Control Header - Title and action buttons
 * C. LeadFlowSnapshot - Four summary tiles
 * D. Reddit Leads Table - From LiveWire backend
 * E. Lead Analytics - Charts and lead breakdown
 */

import { useEffect, useState, useCallback } from "react";
import { Card, Typography, Row, Col, Statistic, Table, Tag, Spin, Empty, Progress, Space, message, Button, Tooltip, Tabs } from "antd";
import { useList } from "@refinedev/core";
import type { ColumnsType } from 'antd/es/table';
import { FireOutlined, ThunderboltOutlined, LinkOutlined, RedditOutlined } from '@ant-design/icons';

const { Text } = Typography;

// LiveWire backend URL (admiral-server)
const LIVEWIRE_API = 'http://192.168.1.23:5000';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface LeadStats {
  total: number;
  safe: number;
  moderate: number;
  dangerous: number;
  dnc: number;
  bySource: Record<string, number>;
  byCity: Record<string, number>;
  actionable: number;
  waitingReview: number;
  stale: number;
  outOfMarket: number;
}

interface RedditLead {
  id: string;
  author: string;
  postTitle: string;
  postContent: string;
  subreddit: string;
  intentScore: number;
  intentTier: 'HOT' | 'WARM' | 'COLD';
  keywordsMatched: string[];
  url: string;
  state?: string;
  status: string;
  recommendedNextAction: string;
  notesForCloser?: string;
  isActionable: boolean;
  discoveredAt: string;
  empowerTerritory: boolean;
  utilityMention?: string;
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM STATE BAR
// ═══════════════════════════════════════════════════════════════

function SystemStateBar({ onOpenDiagnostics, stats, redditCount }: { onOpenDiagnostics?: () => void; stats: LeadStats | null; redditCount: number }) {
  const agentStatus = stats ? 'OPERATIONAL' : 'LOADING';
  const freshnessStatus = stats && stats.stale > 0 ? 'VIOLATION' : 'VALID';

  const agentColors: Record<string, { bg: string; text: string; dot: string }> = {
    OPERATIONAL: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', dot: '#22c55e' },
    STOPPED: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', dot: '#6b7280' },
    DEGRADED: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', dot: '#f59e0b' },
    LOADING: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', dot: '#6b7280' },
  };

  const freshnessColors: Record<string, { bg: string; text: string }> = {
    VALID: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
    WARNING: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    VIOLATION: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
  };

  const agentColor = agentColors[agentStatus];
  const freshnessColor = freshnessColors[freshnessStatus];

  return (
    <div
      onClick={onOpenDiagnostics}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1.25rem',
        backgroundColor: 'rgba(12, 47, 74, 0.6)',
        borderBottom: '1px solid rgba(201, 166, 72, 0.15)',
        cursor: onOpenDiagnostics ? 'pointer' : 'default',
        fontSize: '0.8125rem',
        fontFamily: 'monospace',
        letterSpacing: '0.5px',
      }}
    >
      {/* Brand */}
      <span style={{ color: '#c9a648', fontWeight: 600, fontSize: '0.875rem' }}>
        LiveWire
      </span>

      <span style={{ color: 'rgba(247, 245, 242, 0.2)' }}>│</span>

      {/* Agent Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.75rem',
          backgroundColor: agentColor.bg,
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: agentColor.dot,
            animation: agentStatus === 'OPERATIONAL' ? 'pulse 2s infinite' : 'none',
          }}
        />
        <span style={{ color: agentColor.text }}>{agentStatus}</span>
      </div>

      <span style={{ color: 'rgba(247, 245, 242, 0.2)' }}>│</span>

      {/* Freshness Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'rgba(247, 245, 242, 0.5)' }}>TCPA:</span>
        <span
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: freshnessColor.bg,
            color: freshnessColor.text,
            borderRadius: '4px',
            fontWeight: freshnessStatus === 'VIOLATION' ? 600 : 400,
          }}
        >
          {freshnessStatus}
        </span>
      </div>

      <span style={{ color: 'rgba(247, 245, 242, 0.2)' }}>│</span>

      {/* Lead Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'rgba(247, 245, 242, 0.5)' }}>CRM:</span>
        <span style={{ color: '#c9a648', fontWeight: 600 }}>{stats?.total || 0}</span>
      </div>

      <span style={{ color: 'rgba(247, 245, 242, 0.2)' }}>│</span>

      {/* Reddit Lead Count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'rgba(247, 245, 242, 0.5)' }}>Reddit:</span>
        <span style={{ color: '#ff4500', fontWeight: 600 }}>{redditCount}</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Timestamp */}
      <span style={{ color: 'rgba(247, 245, 242, 0.3)', fontSize: '0.75rem' }}>
        Updated: {new Date().toLocaleTimeString()}
      </span>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEAD FLOW SNAPSHOT (Four tiles)
// ═══════════════════════════════════════════════════════════════

function LeadFlowSnapshot({ stats, redditStats }: { stats: LeadStats | null; redditStats: { hot: number; warm: number; actionable: number; total: number } }) {
  const tiles = [
    {
      id: 'reddit-hot',
      label: 'Reddit HOT',
      count: redditStats.hot,
      color: '#ff4500',
      bgColor: 'rgba(255, 69, 0, 0.1)',
    },
    {
      id: 'reddit-warm',
      label: 'Reddit WARM',
      count: redditStats.warm,
      color: '#c9a648',
      bgColor: 'rgba(201, 166, 72, 0.1)',
    },
    {
      id: 'actionable',
      label: 'CRM SAFE',
      count: stats?.safe || 0,
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
    },
    {
      id: 'dnc',
      label: 'DNC Registry',
      count: stats?.dnc || 0,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
      }}
    >
      {tiles.map((tile) => (
        <div
          key={tile.id}
          style={{
            backgroundColor: tile.bgColor,
            borderRadius: '12px',
            border: `1px solid ${tile.color}30`,
            padding: '1.25rem',
            transition: 'all 0.2s ease',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'rgba(247, 245, 242, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {tile.label}
          </span>

          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: tile.count > 0 ? '#f7f5f2' : 'rgba(247, 245, 242, 0.3)',
              lineHeight: 1.2,
              marginTop: '0.5rem',
            }}
          >
            {tile.count}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REDDIT LEADS TABLE
// ═══════════════════════════════════════════════════════════════

function RedditLeadsTable({ leads, loading }: { leads: RedditLead[]; loading: boolean }) {
  const columns: ColumnsType<RedditLead> = [
    {
      title: 'Intent',
      dataIndex: 'intentScore',
      key: 'intentScore',
      width: 80,
      sorter: (a, b) => b.intentScore - a.intentScore,
      render: (score: number, record: RedditLead) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: record.intentTier === 'HOT' ? '#ff4500' : '#c9a648',
            fontFamily: 'monospace'
          }}>
            {score}
          </div>
          <Tag color={record.intentTier === 'HOT' ? 'red' : 'gold'} style={{ marginTop: 4 }}>
            {record.intentTier}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Post',
      dataIndex: 'postTitle',
      key: 'postTitle',
      render: (title: string, record: RedditLead) => (
        <div>
          <a
            href={record.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#c9a648', fontWeight: 500 }}
          >
            {title?.substring(0, 60)}{title?.length > 60 ? '...' : ''}
          </a>
          <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tag color="orange">r/{record.subreddit}</Tag>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              by u/{record.author}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 80,
      render: (state: string) => state ? (
        <Tag color="blue">{state}</Tag>
      ) : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>,
    },
    {
      title: 'Keywords',
      dataIndex: 'keywordsMatched',
      key: 'keywordsMatched',
      width: 200,
      render: (keywords: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {keywords?.slice(0, 3).map((kw, i) => (
            <Tag key={i} style={{ fontSize: '0.7rem' }}>{kw}</Tag>
          ))}
          {keywords?.length > 3 && (
            <Tag style={{ fontSize: '0.7rem' }}>+{keywords.length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notesForCloser',
      key: 'notesForCloser',
      ellipsis: true,
      render: (notes: string) => (
        <Tooltip title={notes}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
            {notes?.substring(0, 50)}{notes?.length > 50 ? '...' : ''}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: RedditLead) => (
        <Button
          type="primary"
          size="small"
          icon={<LinkOutlined />}
          href={record.url}
          target="_blank"
          style={{
            backgroundColor: record.intentTier === 'HOT' ? '#ff4500' : '#c9a648',
            borderColor: record.intentTier === 'HOT' ? '#ff4500' : '#c9a648',
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Table
      dataSource={leads}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} leads` }}
      style={{
        backgroundColor: 'transparent',
      }}
      className="livewire-table"
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

function LiveWirePage() {
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [redditLeads, setRedditLeads] = useState<RedditLead[]>([]);
  const [redditLoading, setRedditLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reddit');

  // Fetch all leads from Twenty CRM
  const { data: leadsData, isLoading, refetch } = useList({
    resource: "leads",
    pagination: { pageSize: 1000 },
  });

  // Fetch Reddit leads from LiveWire backend
  const fetchRedditLeads = useCallback(async () => {
    setRedditLoading(true);
    try {
      const response = await fetch(`${LIVEWIRE_API}/leads`);
      if (response.ok) {
        const data = await response.json();
        setRedditLeads(data.leads || []);
      } else {
        console.error('[LiveWire] Failed to fetch Reddit leads:', response.statusText);
      }
    } catch (error) {
      console.error('[LiveWire] Error fetching Reddit leads:', error);
    } finally {
      setRedditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRedditLeads();
  }, [fetchRedditLeads]);

  useEffect(() => {
    if (leadsData?.data) {
      const leads = leadsData.data;

      const stats: LeadStats = {
        total: leads.length,
        safe: 0,
        moderate: 0,
        dangerous: 0,
        dnc: 0,
        bySource: {},
        byCity: {},
        actionable: 0,
        waitingReview: 0,
        stale: 0,
        outOfMarket: 0,
      };

      leads.forEach((lead: any) => {
        const status = (lead.tcpaStatus || 'unknown').toLowerCase();
        if (status === 'safe') { stats.safe++; stats.actionable++; }
        else if (status === 'moderate') { stats.moderate++; stats.waitingReview++; }
        else if (status === 'dangerous') { stats.dangerous++; stats.stale++; }
        else if (status === 'dnc') { stats.dnc++; stats.outOfMarket++; }

        const source = lead.leadSource || 'Unknown';
        stats.bySource[source] = (stats.bySource[source] || 0) + 1;

        const city = lead.city || 'Unknown';
        stats.byCity[city] = (stats.byCity[city] || 0) + 1;
      });

      setLeadStats(stats);
      setLoading(false);
    }
  }, [leadsData]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([refetch(), fetchRedditLeads()]);
    message.success('Data refreshed');
  }, [refetch, fetchRedditLeads]);

  // Reddit stats
  const redditStats = {
    hot: redditLeads.filter(l => l.intentTier === 'HOT').length,
    warm: redditLeads.filter(l => l.intentTier === 'WARM').length,
    actionable: redditLeads.filter(l => l.isActionable).length,
    total: redditLeads.length,
  };

  // Sort Reddit leads by intent score (descending)
  const sortedRedditLeads = [...redditLeads].sort((a, b) => b.intentScore - a.intentScore);

  const topCities = leadStats
    ? Object.entries(leadStats.byCity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([city, count]) => ({ city, count }))
    : [];

  // Subreddit breakdown
  const subredditCounts = redditLeads.reduce((acc, lead) => {
    acc[lead.subreddit] = (acc[lead.subreddit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSubreddits = Object.entries(subredditCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (isLoading || loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        background: 'linear-gradient(180deg, rgba(12, 47, 74, 0.3) 0%, rgba(0, 0, 0, 0.95) 100%)',
      }}>
        <Spin size="large" />
        <div style={{ marginTop: '1rem', color: 'rgba(247, 245, 242, 0.5)' }}>
          Connecting to LiveWire...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, rgba(12, 47, 74, 0.3) 0%, rgba(0, 0, 0, 0.95) 100%)',
    }}>
      {/* A. SYSTEM STATE BAR */}
      <SystemStateBar stats={leadStats} redditCount={redditLeads.length} />

      {/* MAIN CONTENT */}
      <div style={{ padding: '1.5rem', flex: 1 }}>
        {/* HEADER WITH CONTROLS */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div
              style={{
                color: '#c9a648',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                fontSize: '0.7rem',
                marginBottom: '0.5rem',
              }}
            >
              LIVEWIRE // AUTONOMOUS SALES AI
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 300,
                color: '#f7f5f2',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ color: '#c9a648' }}>⚡</span>
              Control Room
            </h1>
          </div>

          {/* CONTROL BUTTONS */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(201, 166, 72, 0.3)',
                backgroundColor: 'rgba(201, 166, 72, 0.1)',
                color: '#c9a648',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              ↻ Refresh Data
            </button>
          </div>
        </div>

        {/* B. LEAD FLOW SNAPSHOT */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              margin: '0 0 1rem 0',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'rgba(247, 245, 242, 0.4)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Lead Flow
          </h3>
          <LeadFlowSnapshot stats={leadStats} redditStats={redditStats} />
        </div>

        {/* C. REDDIT LEADS TABLE */}
        <div
          style={{
            marginBottom: '1.5rem',
            backgroundColor: 'rgba(12, 47, 74, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(201, 166, 72, 0.15)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: '#ff4500', fontSize: '0.875rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RedditOutlined /> REDDIT LEADS ({redditLeads.length})
            </h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Tag color="red">{redditStats.hot} HOT</Tag>
              <Tag color="gold">{redditStats.warm} WARM</Tag>
              <Tag color="green">{redditStats.actionable} Actionable</Tag>
            </div>
          </div>
          <RedditLeadsTable leads={sortedRedditLeads} loading={redditLoading} />
        </div>

        {/* D. ANALYTICS GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
          }}
        >
          {/* Top Subreddits */}
          <div
            style={{
              backgroundColor: 'rgba(12, 47, 74, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(201, 166, 72, 0.15)',
              padding: '1.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', color: '#ff4500', fontSize: '0.75rem', letterSpacing: '1px' }}>
              TOP SUBREDDITS
            </h4>
            {topSubreddits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topSubreddits.map(([subreddit, count]) => (
                  <div
                    key={subreddit}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: '#ff4500' }}>r/{subreddit}</span>
                    <span style={{ color: '#c9a648', fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No subreddit data" />
            )}
          </div>

          {/* Top States */}
          <div
            style={{
              backgroundColor: 'rgba(12, 47, 74, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(201, 166, 72, 0.15)',
              padding: '1.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', color: '#c9a648', fontSize: '0.75rem', letterSpacing: '1px' }}>
              REDDIT LEADS BY STATE
            </h4>
            {(() => {
              const stateCounts = redditLeads.reduce((acc, lead) => {
                if (lead.state) {
                  acc[lead.state] = (acc[lead.state] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>);
              const topStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
              return topStates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {topStates.map(([state, count]) => (
                    <div
                      key={state}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span style={{ color: 'rgba(247, 245, 242, 0.8)' }}>{state}</span>
                      <span style={{ color: '#c9a648', fontWeight: 600 }}>{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="No state data" />
              );
            })()}
          </div>
        </div>
      </div>

      <style>{`
        .livewire-table .ant-table {
          background: transparent !important;
        }
        .livewire-table .ant-table-thead > tr > th {
          background: rgba(12, 47, 74, 0.6) !important;
          color: #c9a648 !important;
          border-bottom: 1px solid rgba(201, 166, 72, 0.2) !important;
        }
        .livewire-table .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(201, 166, 72, 0.1) !important;
        }
        .livewire-table .ant-table-tbody > tr:hover > td {
          background: rgba(201, 166, 72, 0.1) !important;
        }
        .livewire-table .ant-pagination-item {
          background: rgba(12, 47, 74, 0.6) !important;
          border-color: rgba(201, 166, 72, 0.3) !important;
        }
        .livewire-table .ant-pagination-item a {
          color: #c9a648 !important;
        }
        .livewire-table .ant-pagination-item-active {
          background: #c9a648 !important;
        }
        .livewire-table .ant-pagination-item-active a {
          color: #000 !important;
        }
      `}</style>
    </div>
  );
}

export default LiveWirePage;
