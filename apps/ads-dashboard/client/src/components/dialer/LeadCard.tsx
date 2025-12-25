import { motion } from 'framer-motion';
import { Phone, Mail, Building2, MapPin, Clock, User } from 'lucide-react';

export interface Lead {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  lastContactDate?: string;
  lastDisposition?: string;
}

interface LeadCardProps {
  lead: Lead;
  isActive?: boolean;
  isPeek?: boolean;
  peekIndex?: number;
  isExpanded?: boolean;
  onTap?: () => void;
  showSwipeHint?: boolean;
  callStatus?: 'idle' | 'connecting' | 'connected';
  callDuration?: string;
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return 'No phone';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getTimeSince(dateStr: string | undefined): string {
  if (!dateStr) return 'Never contacted';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function LeadCard({
  lead,
  isActive = true,
  isPeek = false,
  peekIndex = 0,
  isExpanded = false,
  onTap,
  showSwipeHint = false,
  callStatus = 'idle',
  callDuration,
}: LeadCardProps) {
  const isOnCall = callStatus === 'connecting' || callStatus === 'connected';

  // Peek card styling (cards behind the active one)
  const peekStyle = isPeek
    ? {
        scale: 1 - peekIndex * 0.05,
        y: peekIndex * 12,
        opacity: 1 - peekIndex * 0.25,
        zIndex: 10 - peekIndex,
      }
    : { scale: 1, y: 0, opacity: 1, zIndex: 10 };

  return (
    <motion.div
      layout
      initial={false}
      animate={peekStyle}
      whileTap={!isPeek && !isOnCall ? { scale: 0.98 } : undefined}
      onClick={!isPeek && onTap ? onTap : undefined}
      style={{
        position: isPeek ? 'absolute' : 'relative',
        width: '100%',
        maxWidth: 360,
        margin: '0 auto',
        background: 'rgba(12, 47, 74, 0.6)',
        borderRadius: 16,
        border: isOnCall
          ? '2px solid rgba(0, 255, 136, 0.5)'
          : isExpanded
          ? '2px solid rgba(0, 255, 255, 0.4)'
          : '1px solid rgba(0, 255, 255, 0.2)',
        padding: isExpanded ? 24 : 20,
        cursor: isPeek ? 'default' : 'pointer',
        overflow: 'hidden',
        boxShadow: isOnCall
          ? '0 8px 32px rgba(0, 255, 136, 0.2)'
          : '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Call status overlay */}
      {isOnCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: callStatus === 'connected' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 150, 255, 0.2)',
            padding: '6px 12px',
            borderRadius: 20,
            border: `1px solid ${callStatus === 'connected' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 150, 255, 0.4)'}`,
          }}
        >
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: callStatus === 'connected' ? '#00ff88' : '#0096ff',
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: callStatus === 'connected' ? '#00ff88' : '#0096ff',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {callStatus === 'connected' ? callDuration || '00:00' : 'Connecting...'}
          </span>
        </motion.div>
      )}

      {/* Avatar / Initials */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0c2f4a 0%, #1a4a6e 100%)',
            border: '2px solid rgba(201, 166, 72, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#c9a648',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {getInitials(lead.name)}
          </span>
        </div>

        {/* Name */}
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#f7f5f2',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {lead.name || 'Unknown Lead'}
        </h3>

        {/* Phone - prominent */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          <Phone size={16} color="#00ffff" />
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#00ffff',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.5px',
            }}
          >
            {formatPhone(lead.phone)}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        style={{ overflow: 'hidden' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {lead.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {lead.email}
              </span>
            </div>
          )}

          {lead.company && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {lead.company}
              </span>
            </div>
          )}

          {(lead.address || lead.city) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapPin size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {[lead.address, lead.city, lead.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {lead.lastContactDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                Last contact: {getTimeSince(lead.lastContactDate)}
              </span>
            </div>
          )}

          {lead.lastDisposition && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                Previous: {lead.lastDisposition}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Swipe hint */}
      {showSwipeHint && !isExpanded && !isOnCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ← SWIPE TO SKIP →
        </motion.div>
      )}

      {/* Tap hint when not expanded */}
      {!isExpanded && !isOnCall && !showSwipeHint && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          Tap to view details
        </div>
      )}
    </motion.div>
  );
}
