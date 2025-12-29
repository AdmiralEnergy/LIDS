import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Phone,
  MessageSquare,
  Star,
  Clock,
  User,
  ChevronRight,
  AlertTriangle,
  X,
  SortAsc,
  Filter,
} from 'lucide-react';
import type { Lead } from './LeadCard';

interface ContactListProps {
  leads: Lead[];
  selectedLeadId?: string;
  onSelectLead: (lead: Lead) => void;
  onDialPhone: (phoneNumber: string) => void;
  onSmsPhone: (phoneNumber: string) => void;
  onOpenProfile: (lead: Lead) => void;
  isOnCall?: boolean;
}

type SortOption = 'icp' | 'name' | 'recent';

function getPhoneCount(lead: Lead): number {
  let count = 0;
  if (lead.phone) count++;
  if (lead.cell1 && lead.cell1 !== lead.phone) count++;
  if (lead.cell2) count++;
  if (lead.cell3) count++;
  if (lead.cell4) count++;
  if (lead.landline1) count++;
  if (lead.landline2) count++;
  if (lead.landline3) count++;
  if (lead.landline4) count++;
  if (lead.phone1) count++;
  if (lead.phone2) count++;
  return count;
}

function getPrimaryPhone(lead: Lead): string | undefined {
  return lead.phone || lead.cell1 || lead.phone1 || lead.landline1;
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return 'No phone';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

function getIcpColor(score: number | undefined): string {
  if (!score) return 'rgba(255, 255, 255, 0.3)';
  if (score >= 80) return '#00ff88';
  if (score >= 60) return '#c9a648';
  if (score >= 40) return '#ff9900';
  return 'rgba(255, 255, 255, 0.5)';
}

function getTimeSince(dateStr: string | undefined): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ContactList({
  leads,
  selectedLeadId,
  onSelectLead,
  onDialPhone,
  onSmsPhone,
  onOpenProfile,
  isOnCall = false,
}: ContactListProps) {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('icp');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter((lead) => {
        const name = (lead.name || '').toLowerCase();
        const phone = (lead.phone || '').replace(/\D/g, '');
        const address = (lead.address || '').toLowerCase();
        const city = (lead.city || '').toLowerCase();
        return (
          name.includes(search) ||
          phone.includes(search.replace(/\D/g, '')) ||
          address.includes(search) ||
          city.includes(search)
        );
      });
    }

    // Sort
    switch (sortBy) {
      case 'icp':
        result.sort((a, b) => (b.icpScore || 0) - (a.icpScore || 0));
        break;
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'recent':
        result.sort((a, b) => {
          const dateA = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
          const dateB = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return result;
  }, [leads, searchText, sortBy]);

  const handleDialClick = useCallback(
    (e: React.MouseEvent, lead: Lead) => {
      e.stopPropagation();
      const phone = getPrimaryPhone(lead);
      if (phone) {
        onDialPhone(phone);
      }
    },
    [onDialPhone]
  );

  const handleSmsClick = useCallback(
    (e: React.MouseEvent, lead: Lead) => {
      e.stopPropagation();
      const phone = getPrimaryPhone(lead);
      if (phone) {
        onSmsPhone(phone);
      }
    },
    [onSmsPhone]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'transparent',
      }}
    >
      {/* Search and Sort Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          gap: 10,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 10,
          }}
        >
          <Search size={18} color="rgba(255, 255, 255, 0.4)" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search leads..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#f7f5f2',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              <X size={16} color="rgba(255, 255, 255, 0.4)" />
            </button>
          )}
        </div>

        {/* Sort Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(201, 166, 72, 0.15)',
              border: '1px solid rgba(201, 166, 72, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <SortAsc size={20} color="#c9a648" />
          </button>

          {/* Sort Menu */}
          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  top: 50,
                  right: 0,
                  background: 'rgba(12, 47, 74, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 10,
                  padding: 6,
                  zIndex: 100,
                  minWidth: 150,
                }}
              >
                {[
                  { value: 'icp', label: 'ICP Score' },
                  { value: 'name', label: 'Name' },
                  { value: 'recent', label: 'Recent Contact' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as SortOption);
                      setShowSortMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: sortBy === option.value ? 'rgba(201, 166, 72, 0.2)' : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: sortBy === option.value ? '#c9a648' : '#f7f5f2',
                      fontSize: 14,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results Count */}
      <div
        style={{
          padding: '8px 16px',
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
        {searchText && ` matching "${searchText}"`}
      </div>

      {/* Lead List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px 12px',
        }}
      >
        {filteredLeads.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <User size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0 }}>
              {searchText ? 'No leads match your search' : 'No leads available'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredLeads.map((lead) => {
              const phoneCount = getPhoneCount(lead);
              const primaryPhone = getPrimaryPhone(lead);
              const isSelected = lead.id === selectedLeadId;

              return (
                <motion.div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px',
                    background: isSelected
                      ? 'rgba(0, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected
                      ? '1px solid rgba(0, 255, 255, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0c2f4a 0%, #1a4a6e 100%)',
                      border: `2px solid ${getIcpColor(lead.icpScore)}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#c9a648',
                      }}
                    >
                      {getInitials(lead.name)}
                    </span>
                  </div>

                  {/* Lead Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#f7f5f2',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lead.name || 'Unknown'}
                      </span>

                      {/* ICP Badge */}
                      {lead.icpScore !== undefined && lead.icpScore > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 6px',
                            borderRadius: 8,
                            background: `${getIcpColor(lead.icpScore)}22`,
                          }}
                        >
                          <Star
                            size={10}
                            color={getIcpColor(lead.icpScore)}
                            fill={lead.icpScore >= 80 ? getIcpColor(lead.icpScore) : 'none'}
                          />
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: getIcpColor(lead.icpScore),
                            }}
                          >
                            {lead.icpScore}
                          </span>
                        </div>
                      )}

                      {/* TCPA Warning */}
                      {lead.tcpaStatus === 'DNC' && (
                        <AlertTriangle size={14} color="#ff4444" />
                      )}
                    </div>

                    {/* Phone & Info Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: '#00ffff',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {formatPhone(primaryPhone)}
                      </span>

                      {phoneCount > 1 && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: 'rgba(0, 150, 255, 0.2)',
                            color: '#0096ff',
                            fontWeight: 600,
                          }}
                        >
                          +{phoneCount - 1} more
                        </span>
                      )}
                    </div>

                    {/* Last Contact */}
                    {lead.lastContactDate && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 4,
                        }}
                      >
                        <Clock size={10} color="rgba(255, 255, 255, 0.4)" />
                        <span
                          style={{
                            fontSize: 11,
                            color: 'rgba(255, 255, 255, 0.4)',
                          }}
                        >
                          {getTimeSince(lead.lastContactDate)}
                        </span>
                        {lead.lastDisposition && (
                          <span
                            style={{
                              fontSize: 10,
                              color: 'rgba(255, 255, 255, 0.3)',
                              marginLeft: 4,
                            }}
                          >
                            {lead.lastDisposition.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {/* Call Button */}
                    <button
                      onClick={(e) => handleDialClick(e, lead)}
                      disabled={isOnCall || !primaryPhone}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background:
                          isOnCall || !primaryPhone
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isOnCall || !primaryPhone ? 'not-allowed' : 'pointer',
                        opacity: isOnCall || !primaryPhone ? 0.5 : 1,
                      }}
                    >
                      <Phone
                        size={18}
                        color={isOnCall || !primaryPhone ? 'rgba(255,255,255,0.3)' : '#0c2f4a'}
                      />
                    </button>

                    {/* SMS Button */}
                    <button
                      onClick={(e) => handleSmsClick(e, lead)}
                      disabled={!primaryPhone}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: primaryPhone
                          ? 'rgba(0, 150, 255, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)',
                        border: primaryPhone
                          ? '1px solid rgba(0, 150, 255, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: primaryPhone ? 'pointer' : 'not-allowed',
                        opacity: primaryPhone ? 1 : 0.5,
                      }}
                    >
                      <MessageSquare
                        size={18}
                        color={primaryPhone ? '#0096ff' : 'rgba(255,255,255,0.3)'}
                      />
                    </button>

                    {/* Profile Arrow */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile(lead);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronRight size={18} color="rgba(255, 255, 255, 0.5)" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
