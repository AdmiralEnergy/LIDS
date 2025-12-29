import { motion } from 'framer-motion';
import { Calendar, Users, Grid3X3, ExternalLink, Phone, Star, Clock, ChevronRight, X } from 'lucide-react';

interface ScheduledCall {
  id: string;
  leadName: string;
  phone: string;
  datetime: Date;
  notes?: string;
}

interface RecentLead {
  id: string;
  name: string;
  phone?: string;
  lastContact?: Date;
  icpScore?: number;
}

interface AppLink {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
  color: string;
}

interface PhoneHomeScreenProps {
  scheduledCalls?: ScheduledCall[];
  recentLeads?: RecentLead[];
  favoriteLeads?: RecentLead[];
  onCallLead?: (leadId: string, phone: string) => void;
  onViewLead?: (leadId: string) => void;
  onNavigateToDialer?: () => void;
  onClose?: () => void;
}

const DEFAULT_APPS: AppLink[] = [
  {
    id: 'compass',
    name: 'COMPASS',
    icon: <Grid3X3 size={24} />,
    url: 'https://compass.ripemerchant.host',
    color: '#c9a648',
  },
  {
    id: 'academy',
    name: 'Academy',
    icon: <Star size={24} />,
    url: 'https://academy.ripemerchant.host',
    color: '#00ff88',
  },
  {
    id: 'crm',
    name: 'Twenty CRM',
    icon: <Users size={24} />,
    url: 'https://twenty.ripemerchant.host',
    color: '#0096ff',
  },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function PhoneHomeScreen({
  scheduledCalls = [],
  recentLeads = [],
  favoriteLeads = [],
  onCallLead,
  onViewLead,
  onNavigateToDialer,
  onClose,
}: PhoneHomeScreenProps) {
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0c2f4a 0%, #061a2e 100%)',
        overflowY: 'auto',
      }}
    >
      {/* Header with greeting and close button */}
      <div
        style={{
          padding: '24px 20px 16px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </button>
        )}
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {greeting}
        </p>
        <h1
          style={{
            margin: '4px 0 0',
            fontSize: 32,
            fontWeight: 300,
            color: '#f7f5f2',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {currentTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </h1>
      </div>

      {/* Scheduled Calls - Calendar Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          margin: '0 16px 16px',
          padding: 16,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Calendar size={18} color="#c9a648" />
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#c9a648' }}>
            Scheduled Calls
          </h2>
        </div>

        {scheduledCalls.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255, 255, 255, 0.4)' }}>
            No scheduled calls
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scheduledCalls.slice(0, 3).map((call) => (
              <div
                key={call.id}
                onClick={() => onCallLead?.(call.id, call.phone)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(201, 166, 72, 0.1)',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#f7f5f2' }}>
                    {call.leadName}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
                    {formatDate(call.datetime)} at {formatTime(call.datetime)}
                  </p>
                </div>
                <Phone size={18} color="#00ff88" />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Dial - Recent/Favorite Leads */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          margin: '0 16px 16px',
          padding: 16,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#0096ff" />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0096ff' }}>
              Recent Leads
            </h2>
          </div>
          <button
            onClick={onNavigateToDialer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'transparent',
              border: '1px solid rgba(0, 150, 255, 0.3)',
              borderRadius: 12,
              cursor: 'pointer',
              color: '#0096ff',
              fontSize: 12,
            }}
          >
            View All
            <ChevronRight size={14} />
          </button>
        </div>

        {recentLeads.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255, 255, 255, 0.4)' }}>
            No recent leads
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {recentLeads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                onClick={() => lead.phone && onCallLead?.(lead.id, lead.phone)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  background: 'rgba(0, 150, 255, 0.1)',
                  borderRadius: 12,
                  cursor: lead.phone ? 'pointer' : 'default',
                  minWidth: 70,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0c2f4a 0%, #1a4a6e 100%)',
                    border: '2px solid rgba(0, 150, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#0096ff',
                  }}
                >
                  {lead.name?.charAt(0) || '?'}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: '#f7f5f2',
                    textAlign: 'center',
                    maxWidth: 60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lead.name?.split(' ')[0] || 'Unknown'}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Apps Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 16px 16px',
          padding: 16,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Grid3X3 size={18} color="#00ff88" />
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#00ff88' }}>
            Apps
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {DEFAULT_APPS.map((app) => (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px 12px',
                background: `${app.color}15`,
                border: `1px solid ${app.color}40`,
                borderRadius: 14,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${app.color}30 0%, ${app.color}10 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: app.color,
                }}
              >
                {app.icon}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: app.color,
                }}
              >
                {app.name}
              </span>
            </a>
          ))}

          {/* Dialer App */}
          <button
            onClick={onNavigateToDialer}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '16px 12px',
              background: 'rgba(255, 136, 0, 0.15)',
              border: '1px solid rgba(255, 136, 0, 0.4)',
              borderRadius: 14,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(255, 136, 0, 0.3) 0%, rgba(255, 136, 0, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff8800',
              }}
            >
              <Phone size={24} />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#ff8800',
              }}
            >
              Dialer
            </span>
          </button>
        </div>
      </motion.div>

      {/* Quick Actions Footer */}
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          padding: '16px 20px 24px',
        }}
      >
        <button
          onClick={onNavigateToDialer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
            border: 'none',
            borderRadius: 28,
            cursor: 'pointer',
            color: '#0c2f4a',
            fontSize: 15,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)',
          }}
        >
          <Phone size={20} />
          Start Dialing
        </button>
      </div>
    </div>
  );
}
