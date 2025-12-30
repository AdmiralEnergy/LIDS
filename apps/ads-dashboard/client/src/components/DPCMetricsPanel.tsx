/**
 * DPCMetricsPanel - Displays DPC-focused efficiency metrics
 * Based on ADMIRAL_UNIFIED_SALES_FRAMEWORK.md Part 9
 *
 * Two display modes:
 * - compact={true}: Single row of Tags for dialer header
 * - compact={false}: Full card with breakdown for dashboard
 */
import { Card, Tag, Progress, Typography, Space, Tooltip, Row, Col, Statistic } from "antd";
import {
  PhoneOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  type DPCMetrics,
  EFFICIENCY_TIERS,
  RAMP_THRESHOLD,
  DPC_THRESHOLDS,
  getTierColor,
  getECRColor,
  getMetricsInterpretation,
} from "../lib/dpcMetrics";

const { Text, Title } = Typography;

interface DPCMetricsPanelProps {
  metrics: DPCMetrics;
  compact?: boolean;
  showInterpretation?: boolean;
}

// Trend icon component
function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  if (trend === 'improving') {
    return <RiseOutlined style={{ color: '#52c41a', marginLeft: 4 }} />;
  }
  if (trend === 'declining') {
    return <FallOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />;
  }
  return <MinusOutlined style={{ color: '#8c8c8c', marginLeft: 4 }} />;
}

// Compact display for dialer header
function CompactMetrics({ metrics }: { metrics: DPCMetrics }) {
  const tierColor = getTierColor(metrics.dpcTier);
  const ecrColor = getECRColor(metrics.ecrLevel);

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '8px 12px',
      background: 'rgba(12, 47, 74, 0.8)',
      borderRadius: 8,
      marginBottom: 8,
      flexWrap: 'wrap',
      alignItems: 'center',
    }}>
      {/* DPC with tier - PRIMARY */}
      <Tooltip title={`Dials Per Confirmed: ${metrics.isRampPeriod ? 'Building baseline' : `${metrics.dpc} dials per quality enrollment`}`}>
        <Tag
          color={tierColor}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '2px 10px',
          }}
        >
          DPC: {metrics.dpc === Infinity ? '--' : metrics.dpc}
          {!metrics.isRampPeriod && <TrendIcon trend={metrics.dpcTrend} />}
        </Tag>
      </Tooltip>

      {/* ECR quality gate */}
      <Tooltip title={`Enrollment Confirmation Rate: ${metrics.ecr}% of enrollees confirm interest`}>
        <Tag
          color={ecrColor}
          style={{
            fontSize: 12,
            padding: '2px 10px',
          }}
        >
          ECR: {metrics.ecr}%
        </Tag>
      </Tooltip>

      {/* Raw counts */}
      <Tooltip title="Total dials">
        <Tag style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}>
          <PhoneOutlined /> {metrics.rawData.totalDials}
        </Tag>
      </Tooltip>

      <Tooltip title="Confirmed enrollments">
        <Tag style={{ background: 'rgba(82, 196, 26, 0.2)', border: 'none', color: '#52c41a' }}>
          <CheckCircleOutlined /> {metrics.rawData.confirmedEnrollments}
        </Tag>
      </Tooltip>

      <Tooltip title="Appointments set">
        <Tag style={{ background: 'rgba(201, 166, 72, 0.2)', border: 'none', color: '#c9a648' }}>
          <TrophyOutlined /> {metrics.rawData.appointments}
        </Tag>
      </Tooltip>

      {/* Ramp progress if applicable */}
      {metrics.isRampPeriod && (
        <Tooltip title="Building baseline - need 25 confirmed enrollments for tier">
          <Tag style={{ background: 'rgba(140, 140, 140, 0.2)', border: 'none', color: '#8c8c8c' }}>
            Ramp: {metrics.rampProgress}/{RAMP_THRESHOLD}
          </Tag>
        </Tooltip>
      )}
    </div>
  );
}

// Full display for dashboard
function FullMetrics({ metrics, showInterpretation = true }: { metrics: DPCMetrics; showInterpretation?: boolean }) {
  const tierColor = getTierColor(metrics.dpcTier);
  const ecrColor = getECRColor(metrics.ecrLevel);
  const interpretation = getMetricsInterpretation(metrics);

  return (
    <Card
      title={
        <Space>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            Efficiency Metrics
          </Text>
          <Tag color={tierColor}>
            {metrics.dpcTier}
          </Tag>
        </Space>
      }
      style={{
        background: '#0c2f4a',
        borderRadius: 12,
        border: '1px solid rgba(0, 150, 200, 0.25)',
      }}
      styles={{
        header: { borderBottom: '1px solid rgba(255,255,255,0.1)' },
        body: { padding: 24 },
      }}
    >
      {/* DPC Primary Display */}
      <div style={{
        background: 'rgba(15, 54, 84, 0.8)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        border: `1px solid ${tierColor}40`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
            DPC (Dials Per Confirmed)
          </Text>
          <Space>
            <Tag color={tierColor}>{metrics.dpcTier}</Tag>
            <TrendIcon trend={metrics.dpcTrend} />
          </Space>
        </div>

        {metrics.isRampPeriod ? (
          // Ramp period progress bar
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>
                Building Baseline
              </Text>
              <Text style={{ color: '#8c8c8c' }}>
                {metrics.rampProgress}/{RAMP_THRESHOLD} confirmed
              </Text>
            </div>
            <Progress
              percent={(metrics.rampProgress / RAMP_THRESHOLD) * 100}
              strokeColor="#8c8c8c"
              trailColor="rgba(255,255,255,0.1)"
              showInfo={false}
            />
          </div>
        ) : (
          // DPC value with scale
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {metrics.dpc === Infinity ? '--' : metrics.dpc}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                Lower is better
              </Text>
            </div>
            <Progress
              percent={Math.min(100, (1 - (metrics.dpc / 100)) * 100)}
              strokeColor={tierColor}
              trailColor="rgba(255,255,255,0.1)"
              showInfo={false}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ color: '#c9a648', fontSize: 11 }}>Elite: &lt;{DPC_THRESHOLDS.ELITE}</Text>
              <Text style={{ color: tierColor, fontSize: 11 }}>You: {metrics.dpc === Infinity ? '--' : metrics.dpc}</Text>
              <Text style={{ color: '#8c8c8c', fontSize: 11 }}>Sat: {DPC_THRESHOLDS.SATISFACTORY}</Text>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small" style={{ background: 'rgba(15, 54, 84, 0.6)', border: 'none' }}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Dials</Text>}
              value={metrics.rawData.totalDials}
              valueStyle={{ color: '#fff', fontSize: 20, fontFamily: 'var(--font-mono)' }}
              prefix={<PhoneOutlined style={{ color: '#00ffff', marginRight: 4 }} />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>today</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ background: 'rgba(15, 54, 84, 0.6)', border: 'none' }}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Enrolled</Text>}
              value={metrics.rawData.totalEnrollments}
              valueStyle={{ color: '#fff', fontSize: 20, fontFamily: 'var(--font-mono)' }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>today</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ background: 'rgba(15, 54, 84, 0.6)', border: 'none' }}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Confirmed</Text>}
              value={metrics.rawData.confirmedEnrollments}
              valueStyle={{ color: '#52c41a', fontSize: 20, fontFamily: 'var(--font-mono)' }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
            />
            <Tag color={ecrColor} style={{ marginTop: 4, fontSize: 10 }}>
              ECR: {metrics.ecr}%
            </Tag>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ background: 'rgba(15, 54, 84, 0.6)', border: 'none' }}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Appointments</Text>}
              value={metrics.rawData.appointments}
              valueStyle={{ color: '#c9a648', fontSize: 20, fontFamily: 'var(--font-mono)' }}
              prefix={<TrophyOutlined style={{ color: '#c9a648', marginRight: 4 }} />}
            />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>today</Text>
          </Card>
        </Col>
      </Row>

      {/* Secondary Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: 12, background: 'rgba(15, 54, 84, 0.4)', borderRadius: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block' }}>DPE</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
              {metrics.dpe === Infinity ? '--' : metrics.dpe}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, display: 'block' }}>Dials per Enrollment</Text>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: 12, background: 'rgba(15, 54, 84, 0.4)', borderRadius: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block' }}>ECR</Text>
            <Text style={{ color: ecrColor, fontSize: 18, fontWeight: 600 }}>
              {metrics.ecr}%
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, display: 'block' }}>Confirmation Rate</Text>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: 'center', padding: 12, background: 'rgba(15, 54, 84, 0.4)', borderRadius: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block' }}>EAR</Text>
            <Text style={{ color: metrics.ear >= 20 ? '#52c41a' : '#fff', fontSize: 18, fontWeight: 600 }}>
              {metrics.ear}%
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, display: 'block' }}>Enrollment to Appt</Text>
          </div>
        </Col>
      </Row>

      {/* Self-Diagnostic Panel (Part 9.2) */}
      {showInterpretation && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 8,
          borderLeft: '3px solid #00ffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <InfoCircleOutlined style={{ color: '#00ffff', marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 600 }}>What Your Numbers Mean</Text>
          </div>

          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <div>
              <Text style={{ color: '#c9a648', fontWeight: 500 }}>DPC: {metrics.dpc === Infinity ? '--' : metrics.dpc}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', fontSize: 12 }}>
                {interpretation.dpcMeaning}
              </Text>
            </div>

            <div>
              <Text style={{ color: ecrColor, fontWeight: 500 }}>ECR: {metrics.ecr}%</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', fontSize: 12 }}>
                {interpretation.ecrMeaning}
              </Text>
            </div>

            <div>
              <Text style={{ color: '#00ffff', fontWeight: 500 }}>EAR: {metrics.ear}%</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', fontSize: 12 }}>
                {interpretation.earMeaning}
              </Text>
            </div>

            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Text style={{ color: '#fff', fontWeight: 500, display: 'block' }}>Improvement Focus:</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                {interpretation.improvementFocus}
              </Text>
            </div>
          </Space>
        </div>
      )}
    </Card>
  );
}

export function DPCMetricsPanel({ metrics, compact = false, showInterpretation = true }: DPCMetricsPanelProps) {
  if (compact) {
    return <CompactMetrics metrics={metrics} />;
  }

  return <FullMetrics metrics={metrics} showInterpretation={showInterpretation} />;
}
