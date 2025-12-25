import { motion } from 'framer-motion';
import { Phone, Mail, Building2, MapPin, Clock, User, Star, MessageSquare, AlertTriangle } from 'lucide-react';

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
  // PropStream phone fields
  cell1?: string;
  cell2?: string;
  cell3?: string;
  cell4?: string;
  landline1?: string;
  landline2?: string;
  landline3?: string;
  landline4?: string;
  phone1?: string;
  phone2?: string;
  // Additional fields
  icpScore?: number;
  tcpaStatus?: string;
  email1?: string;
  email2?: string;
  email3?: string;
}

interface PhoneEntry {
  number: string;
  type: string;
  isCell: boolean;
}

function getAvailablePhones(lead: Lead): PhoneEntry[] {
  const phones: PhoneEntry[] = [];

  // Add primary phone first if it exists and isn't duplicated
  if (lead.phone) {
    phones.push({ number: lead.phone, type: 'Primary', isCell: true });
  }

  // Add all cell phones
  if (lead.cell1 && lead.cell1 !== lead.phone) phones.push({ number: lead.cell1, type: 'Cell 1', isCell: true });
  if (lead.cell2) phones.push({ number: lead.cell2, type: 'Cell 2', isCell: true });
  if (lead.cell3) phones.push({ number: lead.cell3, type: 'Cell 3', isCell: true });
  if (lead.cell4) phones.push({ number: lead.cell4, type: 'Cell 4', isCell: true });

  // Add landlines
  if (lead.landline1) phones.push({ number: lead.landline1, type: 'Landline 1', isCell: false });
  if (lead.landline2) phones.push({ number: lead.landline2, type: 'Landline 2', isCell: false });
  if (lead.landline3) phones.push({ number: lead.landline3, type: 'Landline 3', isCell: false });
  if (lead.landline4) phones.push({ number: lead.landline4, type: 'Landline 4', isCell: false });

  // Add generic phones
  if (lead.phone1) phones.push({ number: lead.phone1, type: 'Phone 1', isCell: true });
  if (lead.phone2) phones.push({ number: lead.phone2, type: 'Phone 2', isCell: true });

  return phones;
}

function getIcpColor(score: number | undefined): string {
  if (!score) return 'rgba(255, 255, 255, 0.3)';
  if (score >= 80) return '#00ff88'; // Hot
  if (score >= 60) return '#c9a648'; // Warm
  if (score >= 40) return '#ff9900'; // Cool
  return 'rgba(255, 255, 255, 0.5)'; // Cold
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
  onDialPhone?: (phoneNumber: string) => void;
  onSmsPhone?: (phoneNumber: string) => void;
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
  onDialPhone,
  onSmsPhone,
}: LeadCardProps) {
  const isOnCall = callStatus === 'connecting' || callStatus === 'connected';
  const allPhones = getAvailablePhones(lead);
  const primaryPhone = allPhones[0]?.number;

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

        {/* Name + ICP Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
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
          {lead.icpScore !== undefined && lead.icpScore > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 12,
                background: `${getIcpColor(lead.icpScore)}22`,
                border: `1px solid ${getIcpColor(lead.icpScore)}66`,
              }}
            >
              <Star size={12} color={getIcpColor(lead.icpScore)} fill={lead.icpScore >= 80 ? getIcpColor(lead.icpScore) : 'none'} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: getIcpColor(lead.icpScore),
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {lead.icpScore}
              </span>
            </div>
          )}
        </div>

        {/* TCPA Warning */}
        {lead.tcpaStatus && (lead.tcpaStatus === 'DANGEROUS' || lead.tcpaStatus === 'DNC') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(255, 68, 68, 0.2)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              marginTop: 6,
            }}
          >
            <AlertTriangle size={12} color="#ff4444" />
            <span style={{ fontSize: 11, color: '#ff4444', fontWeight: 600 }}>
              {lead.tcpaStatus === 'DNC' ? 'Do Not Call' : 'TCPA Risk'}
            </span>
          </div>
        )}

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
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* All Phone Numbers with Dial/SMS buttons */}
          {allPhones.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 8,
                }}
              >
                All Phone Numbers ({allPhones.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allPhones.map((phoneEntry, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'rgba(255, 255, 255, 0.5)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {phoneEntry.type}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: '#00ffff',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {formatPhone(phoneEntry.number)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* Dial Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDialPhone?.(phoneEntry.number);
                        }}
                        disabled={isOnCall}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isOnCall
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isOnCall ? 'not-allowed' : 'pointer',
                          opacity: isOnCall ? 0.5 : 1,
                        }}
                      >
                        <Phone size={16} color={isOnCall ? 'rgba(255,255,255,0.3)' : '#0c2f4a'} />
                      </button>
                      {/* SMS Button - only for cell phones */}
                      {phoneEntry.isCell && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSmsPhone?.(phoneEntry.number);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'rgba(0, 150, 255, 0.2)',
                            border: '1px solid rgba(0, 150, 255, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <MessageSquare size={16} color="#0096ff" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email */}
          {(lead.email || lead.email1) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {lead.email || lead.email1}
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
